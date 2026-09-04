import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarPlus, MapPin, Check, Clock } from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  Input,
  Label,
  Textarea,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@petprev/ui";
import { visits as seedVisits, petById, type Visit } from "@/lib/tutor-data";
import { useEffect } from "react";
import { mobileApi } from "@/lib/api-client";

export const Route = createFileRoute("/tutor/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda · App do Tutor VetCampo" },
      {
        name: "description",
        content:
          "Histórico de visitas domiciliares, solicitação de novo agendamento e rastreio em tempo real do veterinário.",
      },
      { property: "og:title", content: "Agenda · App do Tutor VetCampo" },
      {
        property: "og:description",
        content: "Agende visitas e acompanhe o veterinário a caminho em tempo real.",
      },
    ],
  }),
  component: Agenda,
});

const statusStyle: Record<string, string> = {
  agendada: "bg-secondary text-secondary-foreground",
  a_caminho: "bg-primary/12 text-primary",
  concluida: "bg-success/15 text-success",
};

const statusLabel: Record<string, string> = {
  agendada: "Agendada",
  a_caminho: "A caminho",
  concluida: "Concluída",
};

function Agenda() {
  const [open, setOpen] = useState(false);
  const [visitsList, setVisitsList] = useState<Visit[]>(seedVisits);
  const [scheduleForm, setScheduleForm] = useState({
    date: "",
    period: "Manhã",
    reason: "",
  });

  useEffect(() => {
    let isMounted = true;
    mobileApi
      .getAppointments()
      .then((serverAppointments: any[]) => {
        if (isMounted && Array.isArray(serverAppointments) && serverAppointments.length > 0) {
          const mapped: Visit[] = serverAppointments.map((a) => {
            let st: "agendada" | "a_caminho" | "concluida" = "agendada";
            if (a.status === "EN_ROUTE") st = "a_caminho";
            else if (a.status === "COMPLETED") st = "concluida";

            return {
              id: a.id,
              petId: a.pet_id,
              date: a.scheduled_date
                ? new Date(a.scheduled_date).toLocaleDateString("pt-BR")
                : "Hoje",
              time: a.time_window_start
                ? `${a.time_window_start.slice(0, 5)} - ${a.time_window_end?.slice(0, 5)}`
                : "Horário a definir",
              reason: a.pet?.name ? `Atendimento para ${a.pet.name}` : "Consulta preventiva",
              vet: a.veterinarian?.full_name || "Veterinário a caminho",
              status: st,
            };
          });
          setVisitsList(mapped);
        }
      })
      .catch(() => {
        // Fallback para lista seed
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRequestAppointment = async () => {
    if (!scheduleForm.date) {
      toast.error("Por favor, selecione a data.");
      return;
    }

    const newVisitLocal: Visit = {
      id: `a${visitsList.length + 1}`,
      petId: "p1",
      date: scheduleForm.date,
      time: scheduleForm.period === "Tarde" ? "14:00 - 18:00" : "08:00 - 12:00",
      reason: scheduleForm.reason || "Visita de rotina",
      vet: "Aguardando confirmação",
      status: "agendada",
    };

    setVisitsList((prev) => [newVisitLocal, ...prev]);

    try {
      await mobileApi.requestAppointment({
        pet_id: "00000000-0000-0000-0000-000000000000",
        scheduled_date: scheduleForm.date,
        time_window_start: scheduleForm.period === "Tarde" ? "14:00:00" : "08:00:00",
        time_window_end: scheduleForm.period === "Tarde" ? "18:00:00" : "12:00:00",
      });
      toast.success("Solicitação enviada e registrada no servidor!");
    } catch {
      toast.success("Solicitação registrada localmente (modo offline).");
    }

    setOpen(false);
  };

  const tracking = visitsList.find((v) => v.status === "a_caminho");

  return (
    <main className="space-y-5 px-4 pt-8">
      <header className="flex items-end justify-between">
        <div>
          <p className="field-label">Atendimentos</p>
          <h1 className="text-2xl font-bold tracking-tight">Agenda</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <CalendarPlus className="size-4" /> Agendar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[92vw] rounded-2xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Solicitar novo agendamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="date">Data desejada</Label>
                <Input id="date" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="period">Período</Label>
                <Input id="period" placeholder="Manhã, tarde ou noite" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Motivo</Label>
                <Textarea id="reason" rows={3} placeholder="Descreva o motivo da visita" />
              </div>
            </div>
            <DialogFooter>
              <Button
                className="w-full"
                onClick={() => {
                  setOpen(false);
                  toast.success("Solicitação enviada! A clínica confirma em até 2h.");
                }}
              >
                Enviar solicitação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {tracking && (
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div className="relative h-36 bg-[radial-gradient(circle_at_30%_40%,var(--color-accent),transparent_60%),linear-gradient(135deg,var(--color-secondary),var(--color-muted))]">
            <span className="absolute left-8 top-10 grid size-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg">
              <MapPin className="size-4" />
            </span>
            <span className="absolute bottom-8 right-10 size-3 rounded-full bg-success ring-4 ring-success/25" />
            <svg className="absolute inset-0 h-full w-full" aria-hidden>
              <path
                d="M50 60 C 120 90, 180 60, 250 110"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="2.5"
                strokeDasharray="6 6"
              />
            </svg>
          </div>
          <div className="p-4">
            <p className="text-sm font-semibold">{tracking.vet} está a caminho</p>
            <p className="text-xs text-muted-foreground">
              Chegada estimada em 12 min · {petById(tracking.petId)?.name} · {tracking.reason}
            </p>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="field-label">Histórico de visitas</h2>
        <ul className="space-y-2">
          {visitsList.map((visit) => (
            <li
              key={visit.id}
              className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4"
            >
              <span className="grid size-9 place-items-center rounded-xl bg-secondary">
                {visit.status === "concluida" ? (
                  <Check className="size-4 text-success" />
                ) : (
                  <Clock className="size-4 text-primary" />
                )}
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold">
                  {visit.date} · {visit.time}
                </p>
                <p className="text-sm text-muted-foreground">
                  {petById(visit.petId)?.name} — {visit.reason}
                </p>
                <p className="text-xs text-muted-foreground">{visit.vet}</p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusStyle[visit.status]}`}
              >
                {statusLabel[visit.status]}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
