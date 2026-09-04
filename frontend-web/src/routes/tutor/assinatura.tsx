import { createFileRoute } from "@tanstack/react-router";
import { TutorShell } from "@/components/TutorShell";
import { CreditCard, AlertCircle, CheckCircle2, AlertTriangle, Gift } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose
} from "@petprev/ui";

export const Route = createFileRoute("/tutor/assinatura")({
  component: TutorAssinatura,
});

function TutorAssinatura() {
  const [isCanceling, setIsCanceling] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  const handleCancel = () => {
    setIsCanceling(true);
    setTimeout(() => {
      setIsCanceling(false);
      setOpenDialog(false);
      toast.success("Assinatura cancelada. Sentiremos sua falta!");
    }, 1500);
  };

  const handleUpdatePayment = () => {
    toast.success("Cartão atualizado com sucesso!");
  };

  return (
    <TutorShell title="Minha Assinatura" subtitle="Gerencie seu plano e forma de pagamento.">
      <div className="max-w-3xl space-y-8">
        
        <div className="rounded-2xl border-2 border-primary bg-primary/5 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <CheckCircle2 className="size-3.5" /> Plano Ativo
            </div>
            <h2 className="text-2xl font-bold">Plano Completo PetPrev</h2>
            <p className="text-sm text-muted-foreground">Cobertura domiciliar para até 2 pets.</p>
          </div>
          <div className="text-center md:text-right">
            <p className="text-3xl font-black">R$ 149<span className="text-lg text-muted-foreground font-semibold">/mês</span></p>
            <p className="text-xs text-muted-foreground mt-1">Próxima cobrança em 05/10/2026</p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-4">Forma de Pagamento</h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-lg bg-accent text-muted-foreground">
                <CreditCard className="size-6" />
              </div>
              <div>
                <p className="font-semibold">Mastercard final 4092</p>
                <p className="text-sm text-muted-foreground">Vencimento 12/2028</p>
              </div>
            </div>
            <button 
              onClick={handleUpdatePayment}
              className="w-full sm:w-auto rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Atualizar Pagamento
            </button>
          </div>
        </div>

        <div className="rounded-xl bg-destructive/10 p-4 flex gap-3 text-destructive border border-destructive/20">
          <AlertCircle className="size-5 shrink-0 mt-0.5" />
          <div className="text-sm flex-1">
            <p className="font-semibold">Cancelamento</p>
            <p className="mt-1 text-destructive/80">
              Você pode cancelar sua assinatura a qualquer momento. Seus pets continuarão cobertos até o final do ciclo de faturamento atual.
            </p>
            
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <button className="mt-4 flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors">
                  <AlertTriangle className="size-4" /> Cancelar Assinatura
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Tem certeza que deseja cancelar?</DialogTitle>
                  <DialogDescription>
                    Você perderá acesso imediato aos agendamentos domiciliares e ao desconto nas vacinas.
                  </DialogDescription>
                </DialogHeader>
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 my-2 flex items-start gap-3">
                  <Gift className="size-8 text-primary shrink-0" />
                  <div>
                    <h4 className="font-bold text-primary">Espere! Temos uma oferta especial.</h4>
                    <p className="text-sm text-muted-foreground mt-1">Fique conosco e ganhe <strong>30% de desconto</strong> na próxima mensalidade. Quer aproveitar?</p>
                  </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
                  <button 
                    onClick={() => { setOpenDialog(false); toast.success("Desconto aplicado! Obrigado por continuar conosco."); }}
                    className="w-full sm:w-auto px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors"
                  >
                    Quero o Desconto
                  </button>
                  <button 
                    onClick={handleCancel}
                    disabled={isCanceling}
                    className="w-full sm:w-auto px-4 py-2 text-sm font-medium border border-destructive text-destructive hover:bg-destructive/10 rounded-lg disabled:opacity-50 transition-colors"
                  >
                    {isCanceling ? "Cancelando..." : "Confirmar Cancelamento"}
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
          </div>
        </div>
      </div>
    </TutorShell>
  );
}
