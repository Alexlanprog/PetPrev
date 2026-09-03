import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Syringe, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { pets, vaccines, prescriptions, clinicalHistory, petById } from "@/lib/tutor-data";
import { printDocument } from "@/lib/print-pdf";

export const Route = createFileRoute("/tutor/prontuario")({
  head: () => ({
    meta: [
      { title: "Prontuário · Carteira de vacinação digital" },
      {
        name: "description",
        content:
          "Carteira de vacinação digital, histórico clínico completo e receitas veterinárias para baixar em PDF.",
      },
      { property: "og:title", content: "Prontuário · Carteira de vacinação digital" },
      {
        property: "og:description",
        content: "Vacinas, histórico clínico e receitas em PDF dos seus pets.",
      },
    ],
  }),
  component: Prontuario,
});

function Prontuario() {
  const [petId, setPetId] = useState(pets[0]!.id);
  const pet = petById(petId)!;

  const downloadPrescription = (id: string) => {
    const rx = prescriptions.find((p) => p.id === id)!;
    const rows = rx.items
      .map((i) => `<tr><td>${i.drug}</td><td>${i.dosage}</td><td>${i.duration}</td></tr>`)
      .join("");
    printDocument(`Receita ${pet.name} ${rx.date}`, `
      <h1>Receituário Veterinário</h1>
      <p class="muted">VetCampo · Atendimento domiciliar</p>
      <p><strong>Paciente:</strong> ${pet.name} (${pet.species}, ${pet.breed})<br/>
      <strong>Tutor:</strong> Ana Ribeiro<br/>
      <strong>Data:</strong> ${rx.date}</p>
      <table><thead><tr><th>Medicamento</th><th>Posologia</th><th>Duração</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <footer>${rx.vet} — ${rx.crmv}</footer>
    `);
  };

  return (
    <main className="space-y-5 px-4 pt-8">
      <header>
        <p className="field-label">Documentos clínicos</p>
        <h1 className="text-2xl font-bold tracking-tight">Prontuário</h1>
      </header>

      <div className="flex gap-2">
        {pets.map((p) => (
          <button
            key={p.id}
            onClick={() => setPetId(p.id)}
            data-active={p.id === petId}
            className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium data-[active=true]:border-primary data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
          >
            {p.emoji} {p.name}
          </button>
        ))}
      </div>

      <Tabs defaultValue="vacinas">
        <TabsList className="w-full">
          <TabsTrigger value="vacinas" className="flex-1">
            Vacinas
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex-1">
            Histórico
          </TabsTrigger>
          <TabsTrigger value="receitas" className="flex-1">
            Receitas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vacinas" className="space-y-2 pt-4">
          {vaccines
            .filter((v) => v.petId === petId)
            .map((v) => (
              <div
                key={v.id}
                className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <span className="grid size-9 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <Syringe className="size-4" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{v.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Aplicada em {v.appliedAt} · lote {v.lot}
                  </p>
                  <p className="text-xs text-muted-foreground">{v.vet}</p>
                </div>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold">
                  Próx. {v.nextDose}
                </span>
              </div>
            ))}
          <Button
            variant="secondary"
            className="w-full gap-2"
            onClick={() =>
              printDocument(`Carteira de vacinacao ${pet.name}`, `
                <h1>Carteira de Vacinação Digital</h1>
                <p class="muted">${pet.name} · ${pet.breed}</p>
                <table><thead><tr><th>Vacina</th><th>Aplicação</th><th>Próxima dose</th><th>Lote</th></tr></thead><tbody>
                ${vaccines
                  .filter((v) => v.petId === petId)
                  .map(
                    (v) =>
                      `<tr><td>${v.name}</td><td>${v.appliedAt}</td><td>${v.nextDose}</td><td>${v.lot}</td></tr>`,
                  )
                  .join("")}
                </tbody></table><footer>VetCampo · documento gerado pelo app do tutor</footer>
              `)
            }
          >
            <Download className="size-4" /> Baixar carteira em PDF
          </Button>
        </TabsContent>

        <TabsContent value="historico" className="space-y-2 pt-4">
          {clinicalHistory
            .filter((h) => h.petId === petId)
            .map((h) => (
              <div key={h.id} className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">{h.date}</p>
                <p className="text-sm font-semibold">{h.title}</p>
                <p className="text-sm text-muted-foreground">{h.summary}</p>
              </div>
            ))}
        </TabsContent>

        <TabsContent value="receitas" className="space-y-2 pt-4">
          {prescriptions.filter((r) => r.petId === petId).length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma receita para este pet.</p>
          )}
          {prescriptions
            .filter((r) => r.petId === petId)
            .map((rx) => (
              <div key={rx.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-accent text-accent-foreground">
                    <FileText className="size-4" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Receita de {rx.date}</p>
                    <p className="text-xs text-muted-foreground">
                      {rx.vet} · {rx.crmv}
                    </p>
                  </div>
                </div>
                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                  {rx.items.map((i) => (
                    <li key={i.drug}>
                      {i.drug} — {i.dosage} ({i.duration})
                    </li>
                  ))}
                </ul>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3 w-full gap-2"
                  onClick={() => downloadPrescription(rx.id)}
                >
                  <Download className="size-4" /> Baixar em PDF
                </Button>
              </div>
            ))}
        </TabsContent>
      </Tabs>
    </main>
  );
}
