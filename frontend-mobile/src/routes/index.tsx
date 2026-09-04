import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Thermometer,
  ClipboardPlus,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Clock,
} from "lucide-react";
import { SyncBar } from "@/components/SyncBar";
import { useOfflineQueue } from "@/hooks/use-offline-queue";
import { clearSynced, type QueuedRecord } from "@/lib/offline-db";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VetCampo · Atendimento domiciliar offline-first" },
      {
        name: "description",
        content:
          "App do veterinário para visitas domiciliares: checagem da caixa térmica, prontuário SOAP com assinatura do tutor e sincronização automática.",
      },
      { property: "og:title", content: "VetCampo · Atendimento domiciliar offline-first" },
      {
        property: "og:description",
        content:
          "Registre temperatura da caixa térmica, prontuário SOAP e assinatura do tutor mesmo sem internet.",
      },
    ],
  }),
  component: Home,
});

const kindLabel: Record<string, string> = {
  cold_chain_check: "Caixa térmica",
  soap_record: "Prontuário SOAP",
};

function StatusIcon({ record }: { record: QueuedRecord }) {
  if (record.status === "synced") return <CheckCircle2 className="size-4 text-success" />;
  if (record.status === "syncing") return <Loader2 className="size-4 animate-spin text-primary" />;
  if (record.status === "failed") return <AlertTriangle className="size-4 text-destructive" />;
  return <Clock className="size-4 text-warning" />;
}

function Home() {
  const { records } = useOfflineQueue();

  return (
    <main className="mx-auto min-h-screen w-full max-w-md space-y-5 px-4 pb-16 pt-8">
      <header className="space-y-1">
        <p className="field-label">Visita #VD-2043 · 15:20</p>
        <h1 className="text-2xl font-bold tracking-tight">Atendimento domiciliar</h1>
        <p className="text-sm text-muted-foreground">
          Tutor Ana Ribeiro · Paciente Thor (Golden Retriever, 4a)
        </p>
      </header>

      <SyncBar />

      <section className="grid gap-3">
        <Link
          to="/caixa-termica"
          className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] transition-transform active:scale-[0.99]"
        >
          <span className="grid size-11 place-items-center rounded-xl bg-accent text-accent-foreground">
            <Thermometer className="size-5" />
          </span>
          <span className="flex-1">
            <span className="block font-semibold">1. Caixa térmica</span>
            <span className="block text-sm text-muted-foreground">
              Verificar temperatura e registrar foto
            </span>
          </span>
        </Link>

        <Link
          to="/prontuario"
          className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] transition-transform active:scale-[0.99]"
        >
          <span className="grid size-11 place-items-center rounded-xl bg-accent text-accent-foreground">
            <ClipboardPlus className="size-5" />
          </span>
          <span className="flex-1">
            <span className="block font-semibold">2. Prontuário SOAP</span>
            <span className="block text-sm text-muted-foreground">
              Evolução clínica e assinatura do tutor
            </span>
          </span>
        </Link>
      </section>

      <Link
        to="/tutor"
        className="block rounded-2xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground"
      >
        Abrir o App do Tutor →
      </Link>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="field-label">Fila de sincronização</h2>
          {records.some((r) => r.status === "synced") && (
            <Button variant="ghost" size="sm" onClick={clearSynced}>
              Limpar enviados
            </Button>
          )}
        </div>
        {records.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            Nenhum registro local ainda. Tudo que você salvar fica no dispositivo até a rede voltar.
          </p>
        ) : (
          <ul className="space-y-2">
            {records.map((record) => (
              <li
                key={record.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5"
              >
                <StatusIcon record={record} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{kindLabel[record.kind] ?? record.kind}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(record.createdAt).toLocaleString("pt-BR")} · tentativas:{" "}
                    {record.attempts}
                    {record.lastError ? ` · ${record.lastError}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
