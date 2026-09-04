import { createFileRoute, Link } from "@tanstack/react-router";
import { TutorShell } from "@/components/TutorShell";
import { MapPin, Syringe, CalendarPlus, ChevronRight, CheckCircle2, QrCode, ShieldCheck } from "lucide-react";
import { visits, vaccines, petById, pets, type Visit } from "@/lib/tutor-data";
import { useState } from "react";
import { toast } from "sonner";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
  DialogClose 
} from "@petprev/ui";

export const Route = createFileRoute("/tutor/")({
  component: TutorHome,
});

function TutorHome() {
  const [localVisits, setLocalVisits] = useState<Visit[]>(visits);
  const [isScheduling, setIsScheduling] = useState(false);
  const [selectedPet, setSelectedPet] = useState("");
  const [openDialog, setOpenDialog] = useState(false);

  const next = localVisits.find((v) => v.status !== "concluida");
  const nextPet = next ? petById(next.petId) : undefined;
  const pending = vaccines.filter((v) => !petById(v.petId)?.vaccinesUpToDate).length;

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    setIsScheduling(true);
    setTimeout(() => {
      const newVisit: Visit = {
        id: "a" + Date.now(),
        petId: selectedPet || pets[0].id,
        date: "Em breve",
        time: "A definir",
        reason: "Consulta agendada pelo app",
        vet: "Veterinário a definir",
        status: "agendada",
      };
      setLocalVisits([newVisit, ...localVisits]);
      setIsScheduling(false);
      setOpenDialog(false);
      toast.success("Consulta solicitada com sucesso!");
    }, 1500);
  };

  return (
    <TutorShell title="Bem-vinda de volta, Ana" subtitle="Aqui está o resumo dos seus pets e próximos atendimentos.">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {next && (
          <div className="col-span-full lg:col-span-2 rounded-2xl bg-primary p-6 text-primary-foreground shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider opacity-80">Próximo atendimento</p>
                <p className="mt-2 text-3xl font-bold">
                  {next.date} às {next.time}
                </p>
                <p className="mt-1 text-lg opacity-90">
                  {nextPet?.name} · {next.reason}
                </p>
                <p className="opacity-90">{next.vet}</p>
              </div>
              {next.status === "a_caminho" && (
                <div className="animate-pulse rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur">
                  Em deslocamento
                </div>
              )}
            </div>
            {next.status === "a_caminho" && (
              <Link
                to="/tutor/agenda"
                className="mt-6 flex w-fit items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-primary shadow-sm hover:bg-white/90 transition-colors"
              >
                <MapPin className="size-5" /> Acompanhar trajeto no mapa
              </Link>
            )}
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-chart-2/10 text-chart-2">
              <Syringe className="size-5" />
            </div>
            <div>
              <p className="font-semibold">Vacinas pendentes</p>
              <p className="text-2xl font-bold">{pending}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {pending > 0
              ? "Alguns dos seus pets precisam de atualização vacinal."
              : "Todos os seus pets estão protegidos!"}
          </p>
          {pending > 0 && (
            <Dialog>
              <DialogTrigger asChild>
                <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-chart-2/10 px-4 py-2.5 text-sm font-semibold text-chart-2 hover:bg-chart-2/20 transition-colors">
                  Ver carteirinhas pendentes
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Carteiras de Vacinação</DialogTitle>
                  <DialogDescription>
                    Veja as pendências dos seus pets.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  {pets.filter(p => !p.vaccinesUpToDate).map(pet => (
                    <div key={pet.id} className="mt-2 rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <QrCode className="size-24" />
                      </div>
                      <div className="flex items-center gap-4 mb-4 relative z-10">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm border border-border">
                          {pet.emoji}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold">{pet.name}</h3>
                          <p className="text-xs text-muted-foreground">{pet.species} · {pet.breed}</p>
                        </div>
                      </div>
                      <div className="space-y-3 relative z-10">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Pendências</h4>
                        {vaccines.filter(v => v.petId === pet.id).map(v => (
                          <div key={v.id} className="flex items-start gap-3 rounded-lg bg-white p-3 shadow-sm border border-border border-l-4 border-l-chart-2">
                            <Syringe className="size-4 text-chart-2 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate text-chart-2">{v.name}</p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <span className="font-medium">Reforço atrasado: {v.nextDose}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-chart-4/10 text-chart-4">
              <CalendarPlus className="size-5" />
            </div>
            <div>
              <p className="font-semibold">Novo atendimento</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Agende uma nova consulta ou reforço de vacina no conforto do seu lar.
          </p>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                Agendar agora
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Atendimento em Domicílio</DialogTitle>
                <DialogDescription>
                  Selecione o pet e o motivo do atendimento. Nossa equipe entrará em contato para confirmar o horário exato.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSchedule} className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Qual pet será atendido?</label>
                  <select 
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    value={selectedPet}
                    onChange={(e) => setSelectedPet(e.target.value)}
                    required
                  >
                    <option value="" disabled>Selecione um pet...</option>
                    {pets.map(p => (
                      <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Motivo</label>
                  <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none">
                    <option>Consulta de Rotina</option>
                    <option>Vacinação</option>
                    <option>Sintomas (Vômito, diarreia, etc)</option>
                    <option>Exames Laboratoriais</option>
                  </select>
                </div>
                <DialogFooter className="pt-4">
                  <DialogClose asChild>
                    <button type="button" className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-lg transition-colors">Cancelar</button>
                  </DialogClose>
                  <button 
                    type="submit" 
                    disabled={isScheduling}
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isScheduling ? "Processando..." : <><CheckCircle2 className="size-4" /> Confirmar Solicitação</>}
                  </button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </TutorShell>
  );
}
