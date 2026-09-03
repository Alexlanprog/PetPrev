import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SignaturePad } from "@/components/SignaturePad";
import { SyncBar } from "@/components/SyncBar";
import { enqueue, type SoapPayload } from "@/lib/offline-db";

export const Route = createFileRoute("/prontuario")({
  head: () => ({
    meta: [
      { title: "Prontuário SOAP · Assinatura do tutor" },
      {
        name: "description",
        content:
          "Preencha o prontuário clínico SOAP e colete a assinatura do tutor na tela, com salvamento local imediato.",
      },
      { property: "og:title", content: "Prontuário SOAP · Assinatura do tutor" },
      {
        property: "og:description",
        content: "Evolução clínica SOAP com assinatura digital do tutor, offline-first.",
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
    hint: "Exame físico, TPC, FC/FR, temperatura, achados",
  },
  {
    key: "assessment" as const,
    title: "A · Avaliação",
    hint: "Diagnósticos diferenciais e conclusão clínica",
  },
  { key: "plan" as const, title: "P · Plano", hint: "Terapêutica, exames e retorno" },
];

type SoapFields = Record<(typeof sections)[number]["key"], string>;

function Soap() {
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState("Thor");
  const [tutorName, setTutorName] = useState("Ana Ribeiro");
  const [fields, setFields] = useState<SoapFields>({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
  });
  const [signature, setSignature] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fields.subjective.trim() || !fields.objective.trim()) {
      toast.error("Preencha ao menos Subjetivo e Objetivo.");
      return;
    }
    if (!signature) {
      toast.error("Colete a assinatura do tutor para finalizar.");
      return;
    }

    const payload: SoapPayload = {
      visitId: "VD-2043",
      patientName,
      tutorName,
      ...fields,
      signatureDataUrl: signature,
      signedAt: Date.now(),
    };
    enqueue<SoapPayload>("soap_record", payload);
    toast.success("Prontuário salvo localmente e na fila de sincronização.");
    void navigate({ to: "/" });
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-md space-y-5 px-4 pb-16 pt-6">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="size-4" /> Voltar
      </Link>

      <header className="space-y-1">
        <p className="field-label">Etapa 2 de 2</p>
        <h1 className="text-2xl font-bold tracking-tight">Prontuário clínico SOAP</h1>
        <p className="text-sm text-muted-foreground">Visita VD-2043 · atendimento domiciliar</p>
      </header>

      <SyncBar />

      <form onSubmit={submit} className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="patient">Paciente</Label>
            <Input
              id="patient"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tutor">Tutor</Label>
            <Input id="tutor" value={tutorName} onChange={(e) => setTutorName(e.target.value)} />
          </div>
        </div>

        {sections.map((section) => (
          <div key={section.key} className="space-y-2">
            <Label htmlFor={section.key}>{section.title}</Label>
            <Textarea
              id={section.key}
              rows={4}
              placeholder={section.hint}
              value={fields[section.key]}
              onChange={(e) => setFields((f) => ({ ...f, [section.key]: e.target.value }))}
            />
          </div>
        ))}

        <div className="space-y-2">
          <Label>Assinatura do tutor</Label>
          <p className="text-xs text-muted-foreground">
            Declaro ciência do procedimento realizado e do plano terapêutico proposto.
          </p>
          <SignaturePad onChange={setSignature} />
        </div>

        <Button type="submit" size="lg" className="w-full">
          Finalizar atendimento
        </Button>
      </form>
    </main>
  );
}
