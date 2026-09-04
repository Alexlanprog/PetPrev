import { createFileRoute } from "@tanstack/react-router";
import { VetShell } from "@/components/VetShell";
import { ClipboardList, Thermometer, User, Pill, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/vet/prontuario")({
  component: VetProntuario,
});

function VetProntuario() {
  const [loading, setLoading] = useState(false);
  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Prontuário salvo com sucesso!");
    }, 1000);
  };

  return (
    <VetShell title="Prontuário SOAP" subtitle="Registro clínico detalhado (Subjetivo, Objetivo, Avaliação, Plano).">
      <div className="space-y-8">
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* S - Subjetivo */}
          <div className="space-y-3">
            <label className="text-sm font-bold flex items-center gap-2">
              <User className="size-4 text-chart-4" /> Subjetivo (S)
            </label>
            <p className="text-xs text-muted-foreground">Histórico, queixa principal e informações relatadas pelo tutor.</p>
            <textarea 
              className="w-full h-32 rounded-xl border border-input bg-background px-4 py-3 text-sm focus:border-chart-4 focus:outline-none focus:ring-2 focus:ring-chart-4/20 resize-none transition-all"
              placeholder="Ex: Tutor relata que o pet está apático há 2 dias, com diminuição de apetite..."
            ></textarea>
          </div>

          {/* O - Objetivo */}
          <div className="space-y-3">
            <label className="text-sm font-bold flex items-center gap-2">
              <Thermometer className="size-4 text-chart-4" /> Objetivo (O)
            </label>
            <p className="text-xs text-muted-foreground">Exame físico, sinais vitais e achados clínicos observados.</p>
            <textarea 
              className="w-full h-32 rounded-xl border border-input bg-background px-4 py-3 text-sm focus:border-chart-4 focus:outline-none focus:ring-2 focus:ring-chart-4/20 resize-none transition-all"
              placeholder="Ex: T: 39.2°C, FC: 120 bpm, FR: 30 mpm. Mucosas coradas..."
            ></textarea>
          </div>

          {/* A - Avaliação */}
          <div className="space-y-3">
            <label className="text-sm font-bold flex items-center gap-2">
              <ClipboardList className="size-4 text-chart-4" /> Avaliação (A)
            </label>
            <p className="text-xs text-muted-foreground">Diagnóstico diferencial ou definitivo com base nos dados.</p>
            <textarea 
              className="w-full h-32 rounded-xl border border-input bg-background px-4 py-3 text-sm focus:border-chart-4 focus:outline-none focus:ring-2 focus:ring-chart-4/20 resize-none transition-all"
              placeholder="Ex: Suspeita de gastroenterite alimentar..."
            ></textarea>
          </div>

          {/* P - Plano */}
          <div className="space-y-3">
            <label className="text-sm font-bold flex items-center gap-2">
              <Pill className="size-4 text-chart-4" /> Plano (P)
            </label>
            <p className="text-xs text-muted-foreground">Tratamento, exames solicitados e orientações ao tutor.</p>
            <textarea 
              className="w-full h-32 rounded-xl border border-input bg-background px-4 py-3 text-sm focus:border-chart-4 focus:outline-none focus:ring-2 focus:ring-chart-4/20 resize-none transition-all"
              placeholder="Ex: Prescrito omeprazol 10mg. Solicito hemograma..."
            ></textarea>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-border">
          <button 
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-chart-4 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-chart-4/90 transition-colors disabled:opacity-50"
          >
            <Save className="size-4" />
            {loading ? "Salvando..." : "Salvar Prontuário"}
          </button>
        </div>

      </div>
    </VetShell>
  );
}
