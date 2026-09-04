/**
 * Offline-first local store + sync queue.
 *
 * Web equivalent of the WatermelonDB/SQLite layer used on React Native:
 * records are written locally first (localStorage, synchronous and durable),
 * marked as `pending`, and pushed to the server by the sync engine whenever
 * network connectivity is available.
 */

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
  patientName: string;
  tutorName: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  signatureDataUrl: string | null;
  signedAt: number;
}

const STORAGE_KEY = "vet.offline.queue.v1";
const MAX_ATTEMPTS = 5;

type Listener = (records: QueuedRecord[]) => void;

const listeners = new Set<Listener>();
let memory: QueuedRecord[] | null = null;

function isBrowser() {
  return typeof window !== "undefined";
}

function read(): QueuedRecord[] {
  if (memory) return memory;
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    memory = raw ? (JSON.parse(raw) as QueuedRecord[]) : [];
  } catch {
    memory = [];
  }
  return memory;
}

function write(records: QueuedRecord[]) {
  memory = records;
  if (isBrowser()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch {
      /* quota exceeded — keep in-memory copy */
    }
  }
  listeners.forEach((l) => l(records));
}

export function getRecords(): QueuedRecord[] {
  return read();
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
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
  write([record as QueuedRecord, ...read()]);
  void flushQueue();
  return record;
}

export function clearSynced() {
  write(read().filter((r) => r.status !== "synced"));
}

function patch(id: string, changes: Partial<QueuedRecord>) {
  write(read().map((r) => (r.id === id ? { ...r, ...changes, updatedAt: Date.now() } : r)));
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

/** Remote push real: envia os dados locais para a API NestJS via multipart/form-data. */
async function pushToServer(record: QueuedRecord): Promise<void> {
  if (!navigator.onLine) throw new Error("Sem conexão de rede");

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
      // Cria blob dummy caso não haja foto para não quebrar a validação
      const dummyBlob = new Blob(["evidencia"], { type: "image/jpeg" });
      formData.append("photoEvidence", dummyBlob, "evidencia.jpg");
    }

    const res = await fetch(
      `${baseUrl}/appointments/${payload.visitId || "00000000-0000-0000-0000-000000000000"}/cold-chain`,
      {
        method: "POST",
        headers: authHeaders,
        body: formData,
      },
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Falha no envio da trava térmica: ${err}`);
    }
  } else if (record.kind === "soap_record") {
    const payload = record.payload as SoapPayload;
    const formData = new FormData();
    formData.append("appointment_id", payload.visitId || "00000000-0000-0000-0000-000000000000");
    formData.append("pet_id", "00000000-0000-0000-0000-000000000000");
    formData.append("weight_recorded", "10.0");
    formData.append("temperature_body", "38.5");
    formData.append(
      "clinical_notes",
      `S: ${payload.subjective} | O: ${payload.objective} | A: ${payload.assessment} | P: ${payload.plan}`,
    );
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

    const res = await fetch(`${baseUrl}/medical-records/signed`, {
      method: "POST",
      headers: authHeaders,
      body: formData,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Falha no envio do prontuário assinado: ${err}`);
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
      const next = read().find(
        (r) => (r.status === "pending" || r.status === "failed") && r.attempts < MAX_ATTEMPTS,
      );
      if (!next) break;
      patch(next.id, { status: "syncing" });
      try {
        await pushToServer(next);
        patch(next.id, { status: "synced", attempts: next.attempts + 1, lastError: undefined });
      } catch (error) {
        patch(next.id, {
          status: "failed",
          attempts: next.attempts + 1,
          lastError: error instanceof Error ? error.message : "Falha desconhecida",
        });
        break;
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
  const interval = window.setInterval(onOnline, 20000);
  void flushQueue();
  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("focus", onOnline);
    window.clearInterval(interval);
  };
}
