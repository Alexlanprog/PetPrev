import { createFileRoute } from "@tanstack/react-router";
import { TutorShell } from "@/components/TutorShell";
import { visits, petById, pets, type Visit } from "@/lib/tutor-data";
import { Calendar, Clock, MapPin, User, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
  DialogClose 
} from "@petprev/ui";

export const Route = createFileRoute("/tutor/agenda")({
  component: TutorAgenda,
});

function TutorAgenda() {
  const [localVisits, setLocalVisits] = useState<Visit[]>(visits);
  const [isScheduling, setIsScheduling] = useState(false);
  const [selectedPet, setSelectedPet] = useState("");
  const [openDialog, setOpenDialog] = useState(false);

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
    <TutorShell title="Agenda" subtitle="Seu histórico e próximos agendamentos.">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Agendamentos</h2>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                Novo Agendamento
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

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-accent/50">
                <tr>
                  <th className="px-6 py-4 font-semibold">Data / Hora</th>
                  <th className="px-6 py-4 font-semibold">Paciente</th>
                  <th className="px-6 py-4 font-semibold">Motivo</th>
                  <th className="px-6 py-4 font-semibold">Veterinário(a)</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {localVisits.map((visit) => {
                  const pet = petById(visit.petId);
                  return (
                    <tr key={visit.id} className="hover:bg-accent/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 font-medium">
                          <Calendar className="size-4 text-muted-foreground" /> {visit.date}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-muted-foreground text-xs">
                          <Clock className="size-3" /> {visit.time}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        {pet?.emoji} {pet?.name}
                      </td>
                      <td className="px-6 py-4">{visit.reason}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <User className="size-4 text-muted-foreground" />
                          {visit.vet}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {visit.status === "a_caminho" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                            <MapPin className="size-3" /> Em deslocamento
                          </span>
                        )}
                        {visit.status === "agendada" && (
                          <span className="inline-flex items-center rounded-full bg-chart-4/10 px-2.5 py-1 text-xs font-semibold text-chart-4">
                            Agendada
                          </span>
                        )}
                        {visit.status === "concluida" && (
                          <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                            Concluída
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </TutorShell>
  );
}
