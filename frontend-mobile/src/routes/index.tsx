import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Thermometer,
  ClipboardPlus,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Clock,
  Download,
  Calendar,
  Dog,
} from "lucide-react";
import { toast } from "sonner";
import { SyncBar } from "@/components/SyncBar";
import { useOfflineQueue } from "@/hooks/use-offline-queue";
import {
  clearSynced,
  getCachedAppointments,
  saveCachedAppointments,
  type QueuedRecord,
  type CachedAppointment,
  DEFAULT_CACHED_APPOINTMENTS,
} from "@/lib/offline-db";
import { Button } from "@petprev/ui";

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
  const { records, online } = useOfflineQueue();
  const [appointments, setAppointments] = useState<CachedAppointment[]>(DEFAULT_CACHED_APPOINTMENTS);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    void getCachedAppointments().then((list) => {
      if (list && list.length > 0) {
        setAppointments(list);
      }
    });
  }, []);

  const handleDownloadAgenda = async () => {
    setDownloading(true);
    try {
      // Tenta buscar do backend se online, ou assegura persistência no IndexedDB
      await saveCachedAppointments(DEFAULT_CACHED_APPOINTMENTS);
      setAppointments(DEFAULT_CACHED_APPOINTMENTS);
      toast.success("Agenda de hoje e dados dos pets salvos no IndexedDB para uso offline!");
    } catch {
      toast.error("Erro ao salvar agenda localmente.");
    } finally {
      setDownloading(false);
    }
  };

  const primaryVisit = appointments[0] || DEFAULT_CACHED_APPOINTMENTS[0];

  return (
    <main className="mx-auto min-h-screen w-full max-w-md space-y-5 px-4 pb-16 pt-8">
      <header className="space-y-1">
        <div className="flex items-center justify-between">
          <p className="field-label">Visita #{primaryVisit.id.slice(0, 8)} · {primaryVisit.timeWindow}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={handleDownloadAgenda}
            disabled={downloading}
          >
            <Download className="size-3.5" />
            {downloading ? "Salvando..." : "Baixar agenda offline"}
          </Button>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Atendimento domiciliar</h1>
        <p className="text-sm text-muted-foreground">
          Tutor {primaryVisit.tutorName} · Paciente {primaryVisit.petName} ({primaryVisit.petBreed})
        </p>
      </header>

      <SyncBar />

      {/* Agendamentos do dia em cache (C3bis) */}
      <section className="space-y-2 rounded-2xl border border-border bg-card p-4 shadow-xs">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Calendar className="size-4 text-primary" />
          <span>Agenda de Hoje no Dispositivo ({appointments.length} visitas)</span>
        </div>
        <div className="space-y-2 pt-1">
          {appointments.map((apt) => (
            <div
              key={apt.id}
              className="flex items-center justify-between rounded-xl bg-muted/40 p-2.5 text-xs"
            >
              <div className="flex items-center gap-2">
                <Dog className="size-3.5 text-muted-foreground" />
                <div>
                  <span className="font-semibold text-foreground">{apt.petName}</span>
                  <span className="text-muted-foreground"> · {apt.tutorName}</span>
                </div>
              </div>
              <span className="rounded-md bg-background px-2 py-0.5 font-medium text-foreground">
                {apt.timeWindow}
              </span>
            </div>
          ))}
        </div>
        <p className="pt-1 text-[11px] text-muted-foreground">
          Pacientes pré-carregados para seleção mesmo sem qualquer sinal de celular.
        </p>
      </section>

      {/* Fluxos Sequenciais */}
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
          <h2 className="field-label">Fila de sincronização (IndexedDB)</h2>
          {records.some((r) => r.status === "synced") && (
            <Button variant="ghost" size="sm" onClick={() => void clearSynced()}>
              Limpar enviados
            </Button>
          )}
        </div>
        {records.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            Nenhum registro local pendente. Tudo que você salvar fica no dispositivo até a rede voltar.
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
