import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { VetShell } from "@/components/VetShell";
import { MapPin, Stethoscope, Clock, Check } from "lucide-react";
import { visits, petById } from "@/lib/tutor-data";

export const Route = createFileRoute("/vet/")({
  component: VetHome,
});

function VetHome() {
  const navigate = useNavigate();
  const pending = visits.filter((v) => v.status !== "concluida");
  const completed = visits.filter((v) => v.status === "concluida");

  return (
    <VetShell title="Atendimentos de Hoje" subtitle={`Você tem ${pending.length} consultas pendentes.`}>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="size-5 text-chart-4" /> Próximos Atendimentos
          </h2>
          {pending.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum atendimento pendente.</p>
          ) : (
            pending.map((v) => {
              const pet = petById(v.petId);
              return (
                <div key={v.id} className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{v.time}</span>
                      <span className="text-sm px-2 py-0.5 rounded-full bg-chart-4/10 text-chart-4 font-medium text-xs">
                        {v.status === "a_caminho" ? "Em deslocamento" : "Agendado"}
                      </span>
                    </div>
                    <p className="mt-1 font-semibold">{pet?.name} <span className="text-muted-foreground font-normal">({pet?.breed})</span></p>
                    <p className="text-sm text-muted-foreground">{v.reason}</p>
                    <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="size-3" /> Rua das Flores, 123 - Salvador, BA
                    </p>
                  </div>
                  <button 
                    onClick={() => navigate({ to: "/vet/prontuario" })}
                    className="whitespace-nowrap px-4 py-2 rounded-lg bg-chart-4 text-white text-sm font-semibold hover:bg-chart-4/90 transition-colors"
                  >
                    Iniciar Consulta
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Check className="size-5 text-success" /> Concluídos
          </h2>
          {completed.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum atendimento concluído hoje.</p>
          ) : (
            completed.map((v) => {
              const pet = petById(v.petId);
              return (
                <div key={v.id} className="rounded-xl border border-border bg-accent/50 p-4 opacity-80">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-muted-foreground">{v.time}</span>
                  </div>
                  <p className="mt-1 font-semibold">{pet?.name}</p>
                  <p className="text-sm text-muted-foreground">{v.reason}</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </VetShell>
  );
}
