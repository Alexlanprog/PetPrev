import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ThermometerSnowflake } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhotoCapture } from "@/components/PhotoCapture";
import { SyncBar } from "@/components/SyncBar";
import { enqueue, type ColdChainPayload } from "@/lib/offline-db";

const MIN_C = 2;
const MAX_C = 8;

export const Route = createFileRoute("/caixa-termica")({
  head: () => ({
    meta: [
      { title: "Caixa térmica · Verificação de temperatura" },
      {
        name: "description",
        content:
          "Registre a temperatura da caixa térmica com foto do termômetro antes de iniciar o atendimento domiciliar.",
      },
      { property: "og:title", content: "Caixa térmica · Verificação de temperatura" },
      {
        property: "og:description",
        content: "Checagem da cadeia de frio com evidência fotográfica, funcionando offline.",
      },
    ],
  }),
  component: ColdChain,
});

function ColdChain() {
  const navigate = useNavigate();
  const [boxId, setBoxId] = useState("CX-014");
  const [temperature, setTemperature] = useState("");
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);

  const value = Number(temperature.replace(",", "."));
  const valid = temperature !== "" && !Number.isNaN(value);
  const withinRange = valid && value >= MIN_C && value <= MAX_C;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) {
      toast.error("Informe a temperatura lida no termômetro.");
      return;
    }
    if (!photo) {
      toast.error("A foto do display é obrigatória.");
      return;
    }

    const payload: ColdChainPayload = {
      visitId: "VD-2043",
      temperatureC: value,
      withinRange,
      boxId,
      notes,
      photoDataUrl: photo,
      capturedAt: Date.now(),
    };
    enqueue<ColdChainPayload>("cold_chain_check", payload);
    toast.success("Checagem salva no dispositivo e enfileirada para sincronizar.");
    void navigate({ to: "/prontuario" });
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-md space-y-5 px-4 pb-16 pt-6">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="size-4" /> Voltar
      </Link>

      <header className="space-y-1">
        <p className="field-label">Etapa 1 de 2</p>
        <h1 className="text-2xl font-bold tracking-tight">Verificação da caixa térmica</h1>
        <p className="text-sm text-muted-foreground">
          Faixa segura de conservação: {MIN_C}°C a {MAX_C}°C.
        </p>
      </header>

      <SyncBar />

      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="box">Identificação da caixa</Label>
          <Input id="box" value={boxId} onChange={(e) => setBoxId(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="temp">Temperatura lida (°C)</Label>
          <div className="relative">
            <ThermometerSnowflake className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="temp"
              inputMode="decimal"
              placeholder="Ex.: 5,4"
              className="h-14 pl-11 text-2xl font-semibold"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
            />
          </div>
          {valid && (
            <p
              className={
                withinRange
                  ? "rounded-lg bg-success/12 px-3 py-2 text-sm font-medium text-success"
                  : "rounded-lg bg-destructive/12 px-3 py-2 text-sm font-medium text-destructive"
              }
            >
              {withinRange
                ? "Dentro da faixa segura — pode seguir com o atendimento."
                : "Fora da faixa! Não utilize os imunobiológicos e comunique a clínica."}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Foto do termômetro</Label>
          <PhotoCapture value={photo} onChange={setPhoto} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Observações</Label>
          <Textarea
            id="notes"
            rows={3}
            placeholder="Gelox trocado, lacre íntegro, tempo de transporte..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <Button type="submit" size="lg" className="w-full">
          Salvar checagem e continuar
        </Button>
      </form>
    </main>
  );
}
