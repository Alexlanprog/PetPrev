import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Scale, Thermometer, Dog } from "lucide-react";
import { toast } from "sonner";
import { Button, Input, Label, Textarea } from "@petprev/ui";
import { SignaturePad } from "@/components/SignaturePad";
import { SyncBar } from "@/components/SyncBar";
import {
  enqueue,
  getCachedAppointments,
  type SoapPayload,
  type CachedAppointment,
  DEFAULT_CACHED_APPOINTMENTS,
} from "@/lib/offline-db";

export const Route = createFileRoute("/prontuario")({
  head: () => ({
    meta: [
      { title: "Prontuário SOAP · Assinatura do tutor" },
      {
        name: "description",
        content:
          "Preencha o prontuário clínico SOAP com dados aferidos e colete a assinatura do tutor, com salvamento local no IndexedDB.",
      },
      { property: "og:title", content: "Prontuário SOAP · Assinatura do tutor" },
      {
        property: "og:description",
        content: "Evolução clínica SOAP com assinatura digital do tutor e suporte offline durável.",
      },
    ],
  }),
  component: Soap,
});

const sections = [
  {
    key: "subjective" as const,
    title: "S · Subjetivo",
    hint: "Relato do tutor, histórico e queixa principal",
  },
  {
    key: "objective" as const,
    title: "O · Objetivo",
    hint: "Exame físico, TPC, FC/FR, temperatura corporal, achados clínicos",
  },
  {
    key: "assessment" as const,
    title: "A · Avaliação",
    hint: "Diagnósticos diferenciais e conclusão clínica",
  },
  { key: "plan" as const, title: "P · Plano", hint: "Terapêutica, exames solicitados e orientações" },
];

type SoapFields = Record<(typeof sections)[number]["key"], string>;

function Soap() {
  const navigate = useNavigate();

  // Lista de agendamentos e pets pré-carregados no IndexedDB
  const [appointments, setAppointments] = useState<CachedAppointment[]>(DEFAULT_CACHED_APPOINTMENTS);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>(DEFAULT_CACHED_APPOINTMENTS[0]?.id || "");

  // Campos clínicos reais capturados no atendimento
  const [weight, setWeight] = useState("32.4");
  const [temperature, setTemperature] = useState("38.5");
  const [vaccinesApplied, setVaccinesApplied] = useState("V10 Polivalente (Lote LT-4471)");

  const [fields, setFields] = useState<SoapFields>({
    subjective: "Paciente ativo, sem queixas agudas reportadas pelo tutor.",
    objective: "Mucosas normocoradas, hidratação adequada, ausculta cardiopulmonar sem alterações.",
    assessment: "Animal hígido, apto para protocolo de imunização preventiva domiciliar.",
    plan: "Aplicação de vacina polivalente. Manter acompanhamento preventivo anual.",
  });
  const [signature, setSignature] = useState<string | null>(null);

  useEffect(() => {
    void getCachedAppointments().then((list) => {
      if (list && list.length > 0) {
        setAppointments(list);
        if (!selectedAppointmentId || !list.some((a) => a.id === selectedAppointmentId)) {
          setSelectedAppointmentId(list[0].id);
        }
      }
    });
  }, []);

  const currentAppointment =
    appointments.find((a) => a.id === selectedAppointmentId) || appointments[0] || DEFAULT_CACHED_APPOINTMENTS[0];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    const weightNum = parseFloat(weight.replace(",", "."));
    if (isNaN(weightNum) || weightNum <= 0) {
      toast.error("Informe um peso corporal válido em kg (ex: 32.4).");
      return;
    }

    const tempNum = parseFloat(temperature.replace(",", "."));
    if (isNaN(tempNum) || tempNum < 34 || tempNum > 44) {
      toast.error("Informe uma temperatura corporal fisiológica entre 34°C e 44°C (ex: 38.5).");
      return;
    }

    if (!fields.subjective.trim() || !fields.objective.trim()) {
      toast.error("Preencha ao menos Subjetivo e Objetivo no SOAP.");
      return;
    }

    if (!signature) {
      toast.error("Colete a assinatura do tutor na tela para finalizar.");
      return;
    }

    const payload: SoapPayload = {
      visitId: currentAppointment.id,
      petId: currentAppointment.petId,
      patientName: currentAppointment.petName,
      tutorName: currentAppointment.tutorName,
      weightRecorded: weightNum,
      temperatureBody: tempNum,
      appliedVaccines: vaccinesApplied.trim() ? [vaccinesApplied.trim()] : undefined,
      ...fields,
      signatureDataUrl: signature,
      signedAt: Date.now(),
    };

    enqueue<SoapPayload>("soap_record", payload);
    toast.success("Prontuário gravado com sucesso no IndexedDB local e enfileirado para sincronização!");
    void navigate({ to: "/" });
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-md space-y-5 px-4 pb-16 pt-6">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="size-4" /> Voltar
      </Link>

      <header className="space-y-1">
        <p className="field-label">Etapa 2 de 2 · Prontuário Clínico</p>
        <h1 className="text-2xl font-bold tracking-tight">Evolução Clínica SOAP</h1>
        <p className="text-sm text-muted-foreground">
          Visita: {currentAppointment.id} · {currentAppointment.tutorName}
        </p>
      </header>

      <SyncBar />

      <form onSubmit={submit} className="space-y-5">
        {/* Seleção do Paciente / Agendamento Pré-carregado no IndexedDB */}
        <div className="space-y-2 rounded-xl border border-border bg-card p-3 shadow-xs">
          <Label htmlFor="appointment-select" className="flex items-center gap-2 font-medium">
            <Dog className="size-4 text-primary" /> Paciente e Atendimento
          </Label>
          <select
            id="appointment-select"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
            value={selectedAppointmentId}
            onChange={(e) => setSelectedAppointmentId(e.target.value)}
          >
            {appointments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.petName} ({a.petBreed} - {a.petSpecies}) — Tutor: {a.tutorName}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Dados sincronizados localmente para funcionamento 100% offline.
          </p>
        </div>

        {/* Biometria e Constantes Vitais Reais */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="weight" className="flex items-center gap-1.5 text-xs font-medium">
              <Scale className="size-3.5 text-muted-foreground" /> Peso (kg)
            </Label>
            <Input
              id="weight"
              inputMode="decimal"
              placeholder="Ex: 32.4"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="temp-body" className="flex items-center gap-1.5 text-xs font-medium">
              <Thermometer className="size-3.5 text-muted-foreground" /> Temp. Corporal (°C)
            </Label>
            <Input
              id="temp-body"
              inputMode="decimal"
              placeholder="Ex: 38.5"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Imunobiológicos Aplicados */}
        <div className="space-y-2">
          <Label htmlFor="vaccines" className="text-xs font-medium">
            Imunobiológico / Vacina Aplicada (Lote)
          </Label>
          <Input
            id="vaccines"
            placeholder="Ex: V10 Polivalente (Lote LT-4471)"
            value={vaccinesApplied}
            onChange={(e) => setVaccinesApplied(e.target.value)}
          />
        </div>

        {/* Seções SOAP */}
        {sections.map((section) => (
          <div key={section.key} className="space-y-2">
            <Label htmlFor={section.key} className="text-sm font-semibold">
              {section.title}
            </Label>
            <Textarea
              id={section.key}
              rows={3}
              placeholder={section.hint}
              value={fields[section.key]}
              onChange={(e) => setFields((f) => ({ ...f, [section.key]: e.target.value }))}
            />
          </div>
        ))}

        {/* Assinatura do Tutor */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Assinatura Digital do Tutor</Label>
          <p className="text-xs text-muted-foreground">
            Declaro ciência do procedimento e dos cuidados clínicos recomendados.
          </p>
          <SignaturePad onChange={setSignature} />
        </div>

        <Button type="submit" size="lg" className="w-full font-semibold">
          Finalizar Atendimento Domiciliar
        </Button>
      </form>
    </main>
  );
}
