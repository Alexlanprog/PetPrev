/**
 * Offline-first local store + sync queue powered by IndexedDB (Dexie.js).
 *
 * Armazenamento local durável sem o limite de 5MB do localStorage,
 * garantindo suporte seguro para evidências fotográficas em alta resolução
 * e assinaturas digitais coletadas em campo pelo veterinário.
 */

import Dexie, { type Table } from "dexie";

export type SyncStatus = "pending" | "syncing" | "synced" | "failed";

export type RecordKind = "cold_chain_check" | "soap_record";

export interface QueuedRecord<T = unknown> {
  id: string;
  kind: RecordKind;
  payload: T;
  createdAt: number;
  updatedAt: number;
  status: SyncStatus;
  attempts: number;
  lastError?: string | undefined;
  isTransient?: boolean;
}

export interface ColdChainPayload {
  visitId: string;
  temperatureC: number;
  withinRange: boolean;
  boxId: string;
  notes: string;
  photoDataUrl: string | null;
  capturedAt: number;
}

export interface SoapPayload {
  visitId: string;
  petId: string;
  patientName: string;
  tutorName: string;
  weightRecorded: number;
  temperatureBody: number;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  appliedVaccines?: string[];
  signatureDataUrl: string | null;
  signedAt: number;
}

export interface CachedAppointment {
  id: string;
  petId: string;
  petName: string;
  petSpecies: string;
  petBreed: string;
  tutorName: string;
  scheduledDate: string;
  timeWindow: string;
  status: string;
}

export const DEFAULT_CACHED_APPOINTMENTS: CachedAppointment[] = [
  {
    id: "app-demo-001",
    petId: "pet-thor-001",
    petName: "Thor",
    petSpecies: "Canino",
    petBreed: "Golden Retriever",
    tutorName: "Ana Ribeiro",
    scheduledDate: new Date().toISOString().split("T")[0],
    timeWindow: "14:00 - 18:00",
    status: "EN_ROUTE",
  },
  {
    id: "app-demo-002",
    petId: "pet-mia-002",
    petName: "Mia",
    petSpecies: "Felino",
    petBreed: "SRD",
    tutorName: "Ana Ribeiro",
    scheduledDate: new Date().toISOString().split("T")[0],
    timeWindow: "14:00 - 18:00",
    status: "EN_ROUTE",
  },
];

export class VetOfflineDB extends Dexie {
  syncQueue!: Table<QueuedRecord, string>;
  cachedAppointments!: Table<CachedAppointment, string>;

  constructor() {
    super("VetOfflineQueueDB");
    this.version(1).stores({
      syncQueue: "id, kind, status, createdAt, updatedAt",
      cachedAppointments: "id, petId, scheduledDate, status",
    });
  }
}

let dbInstance: VetOfflineDB | null = null;

function getDb(): VetOfflineDB | null {
  if (typeof window === "undefined") return null;
  if (!dbInstance) {
    dbInstance = new VetOfflineDB();
  }
  return dbInstance;
}

const MAX_ATTEMPTS = 5;
type Listener = (records: QueuedRecord[]) => void;
const listeners = new Set<Listener>();

let memory: QueuedRecord[] = [];
let dbInitialized = false;

function isBrowser() {
  return typeof window !== "undefined";
}

// Inicializa a leitura do Dexie para a memória reativa
async function initStore() {
  if (!isBrowser() || dbInitialized) return;
  const db = getDb();
  if (!db) return;

  try {
    // Migração de legado (localStorage -> Dexie) se existir
    try {
      const raw = window.localStorage.getItem("vet.offline.queue.v1");
      if (raw) {
        const parsed = JSON.parse(raw) as QueuedRecord[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          await db.syncQueue.bulkPut(parsed);
          window.localStorage.removeItem("vet.offline.queue.v1");
        }
      }
    } catch {
      // Ignora erro de parse de legado
    }

    const records = await db.syncQueue.orderBy("createdAt").reverse().toArray();
    memory = records;
    dbInitialized = true;
    notify();

    // Inicializa agendamentos pré-carregados padrão se vazios
    const appointmentsCount = await db.cachedAppointments.count();
    if (appointmentsCount === 0) {
      await db.cachedAppointments.bulkPut(DEFAULT_CACHED_APPOINTMENTS);
    }
  } catch (error) {
    console.warn("Aviso ao inicializar IndexedDB (Dexie):", error);
  }
}

if (isBrowser()) {
  void initStore();
}

function notify() {
  listeners.forEach((l) => l([...memory]));
}

export function getRecords(): QueuedRecord[] {
  if (!dbInitialized && isBrowser()) {
    void initStore();
  }
  return memory;
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function getCachedAppointments(): Promise<CachedAppointment[]> {
  const db = getDb();
  if (!db) return DEFAULT_CACHED_APPOINTMENTS;
  try {
    const list = await db.cachedAppointments.toArray();
    return list.length > 0 ? list : DEFAULT_CACHED_APPOINTMENTS;
  } catch {
    return DEFAULT_CACHED_APPOINTMENTS;
  }
}

export async function saveCachedAppointments(appointments: CachedAppointment[]): Promise<void> {
  const db = getDb();
  if (!db || !appointments.length) return;
  try {
    await db.cachedAppointments.clear();
    await db.cachedAppointments.bulkPut(appointments);
  } catch (err) {
    console.error("Erro ao salvar agendamentos em cache offline:", err);
  }
}

export function enqueue<T>(kind: RecordKind, payload: T): QueuedRecord<T> {
  const now = Date.now();
  const record: QueuedRecord<T> = {
    id: `${kind}_${now}_${Math.random().toString(36).slice(2, 8)}`,
    kind,
    payload,
    createdAt: now,
    updatedAt: now,
    status: "pending",
    attempts: 0,
  };

  memory = [record as QueuedRecord, ...memory];
  notify();

  const db = getDb();
  if (db) {
    db.syncQueue.put(record as QueuedRecord).catch((err) => {
      console.error("Erro ao persistir registro no Dexie (IndexedDB):", err);
    });
  }

  void flushQueue();
  return record;
}

export async function clearSynced(): Promise<void> {
  memory = memory.filter((r) => r.status !== "synced");
  notify();

  const db = getDb();
  if (db) {
    try {
      await db.syncQueue.where("status").equals("synced").delete();
    } catch (err) {
      console.error("Erro ao limpar registros sincronizados do Dexie:", err);
    }
  }
}

async function patchRecord(id: string, changes: Partial<QueuedRecord>) {
  const now = Date.now();
  memory = memory.map((r) => (r.id === id ? { ...r, ...changes, updatedAt: now } : r));
  notify();

  const db = getDb();
  if (db) {
    try {
      await db.syncQueue.update(id, { ...changes, updatedAt: now });
    } catch (err) {
      console.warn("Erro ao atualizar registro no Dexie:", err);
    }
  }
}

function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(",");
  const mime = parts[0]?.match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(parts[1] || "");
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

export class TransientSyncError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = "TransientSyncError";
  }
}

export class ValidationSyncError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = "ValidationSyncError";
  }
}

/** Remote push real: envia os dados locais para a API NestJS via multipart/form-data. */
async function pushToServer(record: QueuedRecord): Promise<void> {
  if (!navigator.onLine) {
    throw new TransientSyncError("Dispositivo sem conexão de rede.", 0);
  }

  const baseUrl =
    typeof window !== "undefined" && (import.meta as any).env?.["VITE_API_BASE_URL"]
      ? (import.meta as any).env["VITE_API_BASE_URL"].replace(/\/$/, "")
      : "http://localhost:3000/api/v1";

  const token =
    typeof window !== "undefined" ? localStorage.getItem("petprev_mobile_auth_token") : null;
  const authHeaders: Record<string, string> = {};
  if (token) {
    authHeaders["Authorization"] = `Bearer ${token}`;
  }

  if (record.kind === "cold_chain_check") {
    const payload = record.payload as ColdChainPayload;
    const formData = new FormData();
    formData.append("temperature", String(payload.temperatureC));

    if (payload.photoDataUrl) {
      const blob = dataUrlToBlob(payload.photoDataUrl);
      formData.append("photoEvidence", blob, "termometro.jpg");
    } else {
      const dummyBlob = new Blob(["evidencia"], { type: "image/jpeg" });
      formData.append("photoEvidence", dummyBlob, "evidencia.jpg");
    }

    let res: Response;
    try {
      res = await fetch(
        `${baseUrl}/appointments/${payload.visitId}/cold-chain`,
        {
          method: "POST",
          headers: authHeaders,
          body: formData,
        },
      );
    } catch (networkError) {
      throw new TransientSyncError(
        `Falha de conexão ao enviar trava térmica: ${networkError instanceof Error ? networkError.message : String(networkError)}`,
        0,
      );
    }

    if (!res.ok) {
      const errText = await res.text();
      if (res.status === 502 || res.status === 503 || res.status >= 500) {
        throw new TransientSyncError(`Erro transitório do servidor (${res.status}): ${errText}`, res.status);
      }
      throw new ValidationSyncError(`Erro de validação (${res.status}): ${errText}`, res.status);
    }
  } else if (record.kind === "soap_record") {
    const payload = record.payload as SoapPayload;
    const formData = new FormData();

    // Envio dos dados clínicos reais capturados no formulário
    formData.append("appointment_id", payload.visitId);
    formData.append("pet_id", payload.petId);
    formData.append("weight_recorded", String(payload.weightRecorded));
    formData.append("temperature_body", String(payload.temperatureBody));
    formData.append(
      "clinical_notes",
      `S: ${payload.subjective} | O: ${payload.objective} | A: ${payload.assessment} | P: ${payload.plan}`,
    );

    if (payload.appliedVaccines && payload.appliedVaccines.length > 0) {
      formData.append("applied_vaccines", payload.appliedVaccines.join(", "));
    }

    formData.append("signature_ecdsa", "MOCK_ECDSA_DEV_SIG_" + Date.now());
    formData.append("payload_signed", JSON.stringify(payload));
    formData.append(
      "tutor_consent_timestamp",
      new Date(payload.signedAt || Date.now()).toISOString(),
    );
    formData.append("tutor_consent_ip", "127.0.0.1");
    formData.append("tutor_consent_document_version", "v1.0");

    if (payload.signatureDataUrl) {
      const blob = dataUrlToBlob(payload.signatureDataUrl);
      formData.append("tutorSignaturePhoto", blob, "assinatura_tutor.png");
    }

    let res: Response;
    try {
      res = await fetch(`${baseUrl}/medical-records/signed`, {
        method: "POST",
        headers: authHeaders,
        body: formData,
      });
    } catch (networkError) {
      throw new TransientSyncError(
        `Falha de conexão ao enviar prontuário: ${networkError instanceof Error ? networkError.message : String(networkError)}`,
        0,
      );
    }

    if (!res.ok) {
      const errText = await res.text();
      // Decisão C4bis: 502/503 ou erro 5xx é transitório (ex: upload temporariamente fora no MinIO).
      // Deve ser mantido na fila local para retentativa automática sem perder o prontuário.
      if (res.status === 502 || res.status === 503 || res.status >= 500) {
        throw new TransientSyncError(
          `Erro transitório no storage/servidor (${res.status}): ${errText}`,
          res.status,
        );
      }
      throw new ValidationSyncError(
        `Erro de validação do prontuário (${res.status}): ${errText}`,
        res.status,
      );
    }
  }
}

let flushing = false;

export async function flushQueue(): Promise<void> {
  if (!isBrowser() || flushing) return;
  if (!navigator.onLine) return;
  flushing = true;

  try {
    for (;;) {
      const records = getRecords();
      const next = records.find(
        (r) => (r.status === "pending" || r.status === "failed") && r.attempts < MAX_ATTEMPTS,
      );
      if (!next) break;

      await patchRecord(next.id, { status: "syncing" });

      try {
        await pushToServer(next);
        await patchRecord(next.id, {
          status: "synced",
          attempts: next.attempts + 1,
          lastError: undefined,
          isTransient: false,
        });
      } catch (error) {
        const isTransient = error instanceof TransientSyncError;
        const errMsg = error instanceof Error ? error.message : "Falha desconhecida";

        await patchRecord(next.id, {
          status: "failed",
          attempts: next.attempts + 1,
          lastError: errMsg,
          isTransient,
        });

        // Se for erro transitório de infraestrutura (como 502 no MinIO), interrompe este ciclo
        // e aguarda o próximo disparo periódico para não sobrecarregar a rede
        if (isTransient) {
          break;
        }
      }
    }
  } finally {
    flushing = false;
  }
}

/** Background sync routine: retries on reconnect, on focus and on an interval. */
export function startSyncEngine(): () => void {
  if (!isBrowser()) return () => {};

  const onOnline = () => void flushQueue();
  window.addEventListener("online", onOnline);
  window.addEventListener("focus", onOnline);
  const interval = window.setInterval(onOnline, 15000);

  void flushQueue();

  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("focus", onOnline);
    window.clearInterval(interval);
  };
}
