import { useEffect, useState } from "react";
import { getRecords, startSyncEngine, subscribe, type QueuedRecord } from "@/lib/offline-db";

export function useOfflineQueue() {
  const [records, setRecords] = useState<QueuedRecord[]>([]);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setRecords(getRecords());
    setOnline(navigator.onLine);
    const unsubscribe = subscribe(setRecords);
    const stopEngine = startSyncEngine();
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      unsubscribe();
      stopEngine();
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const pending = records.filter((r) => r.status !== "synced").length;

  return { records, pending, online };
}
