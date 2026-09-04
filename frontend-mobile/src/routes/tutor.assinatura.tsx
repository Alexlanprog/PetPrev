import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CreditCard, UserPlus, LifeBuoy, Check, Receipt } from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  Input,
  Label,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@petprev/ui";

import { useEffect } from "react";
import { mobileApi } from "@/lib/api-client";

export const Route = createFileRoute("/tutor/assinatura")({
  head: () => ({
    meta: [
      { title: "Assinatura · Plano e cobrança" },
      {
        name: "description",
        content:
          "Gerencie seu plano VetCampo, dados de cobrança, inclusão de dependentes e canais de ajuda.",
      },
      { property: "og:title", content: "Assinatura · Plano e cobrança" },
      {
        property: "og:description",
        content: "Plano, faturas, dependentes e suporte do seu plano de saúde pet.",
      },
    ],
  }),
  component: Assinatura,
});

const benefits = [
  "4 visitas domiciliares por ano",
  "Vacinas do protocolo básico inclusas",
  "Teleorientação 24h",
  "10% de desconto em exames",
];

function Assinatura() {
  const [open, setOpen] = useState(false);
  const [planData, setPlanData] = useState({
    name: "PetPrev Essencial",
    price: "R$ 149,90/mês",
    renewal: "renova no dia 12",
    status: "ACTIVE",
  });

  useEffect(() => {
    let isMounted = true;
    mobileApi
      .getSubscription()
      .then((sub) => {
        if (isMounted && sub && sub.plan_type) {
          setPlanData({
            name: `PetPrev ${sub.plan_type}`,
            price: sub.monthly_price ? `R$ ${sub.monthly_price}/mês` : "R$ 149,90/mês",
            renewal: sub.current_period_end
              ? `renova em ${new Date(sub.current_period_end).toLocaleDateString("pt-BR")}`
              : "renova no dia 12",
            status: sub.status || "ACTIVE",
          });
        }
      })
      .catch(() => {
        // Mantém fallback de demonstração
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="space-y-5 px-4 pt-8">
      <header>
        <p className="field-label">Plano de saúde pet</p>
        <h1 className="text-2xl font-bold tracking-tight">Assinatura</h1>
      </header>

      <section className="rounded-2xl bg-primary p-5 text-primary-foreground shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Plano atual</p>
          <span className="rounded-full bg-primary-foreground/20 px-2 py-0.5 text-[11px] font-medium">
            {planData.status === "ACTIVE" ? "Ativo" : planData.status}
          </span>
        </div>
        <p className="mt-1 text-xl font-bold">{planData.name}</p>
        <p className="text-sm opacity-90">
          {planData.price} · {planData.renewal}
        </p>
        <ul className="mt-4 space-y-1 text-sm">
          {benefits.map((b) => (
            <li key={b} className="flex items-center gap-2">
              <Check className="size-4" /> {b}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="field-label">Dados de cobrança</h2>
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <span className="grid size-10 place-items-center rounded-xl bg-secondary">
            <CreditCard className="size-5 text-primary" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold">Mastercard •••• 4417</p>
            <p className="text-xs text-muted-foreground">Vence em 08/2029 · titular Ana Ribeiro</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => toast.info("Abrindo gestão de cartão…")}>
            Alterar
          </Button>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <span className="grid size-10 place-items-center rounded-xl bg-secondary">
            <Receipt className="size-5 text-primary" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold">Última fatura · 12/08/2026</p>
            <p className="text-xs text-muted-foreground">R$ 149,90 · paga</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toast.success("Fatura enviada por e-mail.")}
          >
            Ver
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="field-label">Dependentes</h2>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm">2 pets inclusos de 3 disponíveis no plano.</p>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm" className="mt-3 w-full gap-2">
                <UserPlus className="size-4" /> Incluir dependente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[92vw] rounded-2xl sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Incluir dependente</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="dep">Nome do pet</Label>
                  <Input id="dep" placeholder="Ex.: Luna" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="depspecies">Espécie e raça</Label>
                  <Input id="depspecies" placeholder="Ex.: Gato SRD" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Sem custo adicional até o 3º pet do plano Família.
                </p>
              </div>
              <DialogFooter>
                <Button
                  className="w-full"
                  onClick={() => {
                    setOpen(false);
                    toast.success("Dependente incluído no plano.");
                  }}
                >
                  Confirmar inclusão
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="field-label">Ajuda</h2>
        <Accordion
          type="single"
          collapsible
          className="rounded-2xl border border-border bg-card px-4"
        >
          <AccordionItem value="a">
            <AccordionTrigger>Como remarcar uma visita?</AccordionTrigger>
            <AccordionContent>
              Vá até a Agenda, abra a visita desejada e toque em solicitar novo horário com até 12h
              de antecedência.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="b">
            <AccordionTrigger>O que o plano não cobre?</AccordionTrigger>
            <AccordionContent>
              Cirurgias eletivas, internação e exames de imagem avançados têm cobrança à parte com
              desconto de assinante.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="c" className="border-b-0">
            <AccordionTrigger>Como cancelar?</AccordionTrigger>
            <AccordionContent>
              O cancelamento pode ser feito a qualquer momento pelo suporte, sem multa após 12
              meses.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <Button
          variant="secondary"
          className="w-full gap-2"
          onClick={() => toast.info("Suporte VetCampo: seg a sáb, 8h às 20h.")}
        >
          <LifeBuoy className="size-4" /> Falar com o suporte
        </Button>
      </section>
    </main>
  );
}
