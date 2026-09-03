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

/** Simulated remote push. Replace with the real API call when the backend exists. */
async function pushToServer(record: QueuedRecord): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  if (!navigator.onLine) throw new Error("Sem conexão de rede");
  // Server accepted the record.
  void record;
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
