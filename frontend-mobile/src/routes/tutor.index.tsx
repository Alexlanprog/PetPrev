import { createFileRoute, Link } from "@tanstack/react-router";
import {
  MapPin,
  Syringe,
  CalendarPlus,
  MessageCircle,
  ChevronRight,
  ShieldCheck,
  LogOut,
  CheckCircle2,
  QrCode,
} from "lucide-react";
import { pets, vaccines, visits, petById, type Visit } from "@/lib/tutor-data";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { toast } from "sonner";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
  DialogClose 
} from "@petprev/ui";

export const Route = createFileRoute("/tutor/")({
  head: () => ({
    meta: [
      { title: "Home · App do Tutor VetCampo" },
      {
        name: "description",
        content:
          "Acompanhe o próximo atendimento domiciliar, o status de vacinação dos seus pets e acesse atalhos rápidos.",
      },
      { property: "og:title", content: "Home · App do Tutor VetCampo" },
      {
        property: "og:description",
        content: "Próximo atendimento, resumo dos pets e status de vacinação em um só lugar.",
      },
    ],
  }),
  component: TutorHome,
});

function TutorHome() {
  const { logout } = useAuth();
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
    <main className="space-y-6 px-4 pt-8">
      <header className="flex items-center justify-between">
        <div>
          <p className="field-label">Bem-vinda de volta</p>
          <h1 className="text-2xl font-bold tracking-tight">Olá, Ana</h1>
        </div>
        <button onClick={logout} className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground">
          <LogOut className="size-5" />
        </button>
      </header>

      {next && (
        <section className="rounded-2xl bg-primary p-5 text-primary-foreground shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
            Próximo atendimento
          </p>
          <p className="mt-1 text-lg font-bold">
            {next.date} às {next.time}
          </p>
          <p className="text-sm opacity-90">
            {nextPet?.name} · {next.reason}
          </p>
          <p className="text-sm opacity-90">{next.vet}</p>
          {next.status === "a_caminho" && (
            <Link
              to="/tutor/agenda"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-foreground/15 px-3 py-2 text-sm font-semibold"
            >
              <MapPin className="size-4" /> Veterinária a caminho · rastrear
            </Link>
          )}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="field-label">Meus pets</h2>
        <div className="grid grid-cols-2 gap-3">
          {pets.map((pet) => (
            <Link
              key={pet.id}
              to="/tutor/pets"
              className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]"
            >
              <span className="text-3xl">{pet.emoji}</span>
              <p className="mt-2 font-semibold">{pet.name}</p>
              <p className="text-xs text-muted-foreground">
                {pet.breed} · {pet.age}
              </p>
              <span
                className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  pet.vaccinesUpToDate
                    ? "bg-success/15 text-success"
                    : "bg-warning/20 text-warning-foreground"
                }`}
              >
                <ShieldCheck className="size-3" />
                {pet.vaccinesUpToDate ? "Vacinas em dia" : "Reforço pendente"}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="field-label">Status da vacinação</h2>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">
              <Syringe className="size-5" />
            </span>
            <div className="flex-1">
              <p className="font-semibold">
                {pending === 0 ? "Tudo em dia" : `${pending} dose(s) a vencer`}
              </p>
              <p className="text-xs text-muted-foreground">
                Mia · reforço V4 e antirrábica em 02/07/2026
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <button className="flex items-center justify-center p-2 rounded-full hover:bg-accent">
                  <ChevronRight className="size-5 text-muted-foreground" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-[calc(100vw-2rem)] rounded-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Carteiras de Vacinação</DialogTitle>
                  <DialogDescription>
                    Veja as pendências dos seus pets.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {pets.filter(p => !p.vaccinesUpToDate).map(pet => (
                    <div key={pet.id} className="mt-2 rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-10">
                        <QrCode className="size-16" />
                      </div>
                      <div className="flex items-center gap-3 mb-3 relative z-10">
                        <div className="flex size-10 items-center justify-center rounded-2xl bg-white text-xl shadow-sm border border-border">
                          {pet.emoji}
                        </div>
                        <div>
                          <h3 className="text-base font-bold">{pet.name}</h3>
                          <p className="text-[10px] text-muted-foreground">{pet.species} · {pet.breed}</p>
                        </div>
                      </div>
                      <div className="space-y-2 relative z-10">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Pendências</h4>
                        {vaccines.filter(v => v.petId === pet.id).map(v => (
                          <div key={v.id} className="flex items-start gap-2 rounded-lg bg-white p-2 shadow-sm border border-border border-l-4 border-l-chart-2">
                            <Syringe className="size-3 text-chart-2 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-xs truncate text-chart-2">{v.name}</p>
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
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
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="field-label">Atalhos rápidos</h2>
        <section className="grid grid-cols-2 gap-3">
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <button className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-card p-4 shadow-[var(--shadow-card)] transition-transform active:scale-95">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CalendarPlus className="size-6" />
              </div>
              <span className="text-sm font-semibold text-foreground">Novo agendamento</span>
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-[calc(100vw-2rem)] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Novo Atendimento</DialogTitle>
              <DialogDescription>
                Selecione o pet e o motivo do atendimento.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSchedule} className="space-y-4 py-2">
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
              <DialogFooter className="pt-2">
                <button 
                  type="submit" 
                  disabled={isScheduling}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {isScheduling ? "Processando..." : <><CheckCircle2 className="size-4" /> Solicitar</>}
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Link
          to="/tutor/assinatura"
          className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-card p-4 shadow-[var(--shadow-card)] transition-transform active:scale-95"
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MessageCircle className="size-6" />
          </div>
          <span className="text-sm font-semibold text-foreground">Falar com suporte</span>
        </Link>
        </section>
      </section>
    </main>
  );
}
