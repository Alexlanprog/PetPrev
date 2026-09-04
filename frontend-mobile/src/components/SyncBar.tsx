import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { useOfflineQueue } from "@/hooks/use-offline-queue";
import { flushQueue } from "@/lib/offline-db";
import { Button } from "@petprev/ui";

export function SyncBar() {
  const { pending, online } = useOfflineQueue();

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2 text-sm">
        {online ? (
          <Cloud className="size-4 text-success" />
        ) : (
          <CloudOff className="size-4 text-warning" />
        )}
        <span className="font-medium">{online ? "Online" : "Modo offline"}</span>
        <span className="text-muted-foreground">
          · {pending} {pending === 1 ? "registro pendente" : "registros pendentes"}
        </span>
      </div>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="gap-2"
        onClick={() => void flushQueue()}
        disabled={!online || pending === 0}
      >
        <RefreshCw className="size-4" /> Sincronizar
      </Button>
    </div>
  );
}
