import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Syringe, FileText, Calendar, CheckCircle2, Printer } from "lucide-react";
import { Button, Tabs, TabsContent, TabsList, TabsTrigger, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@petprev/ui";
import { pets, vaccines, prescriptions, clinicalHistory, petById } from "@/lib/tutor-data";
import { printDocument } from "@/lib/print-pdf";

import { useEffect } from "react";
import { mobileApi } from "@/lib/api-client";

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
  const [vaccinesList, setVaccinesList] = useState(vaccines);
  const pet = petById(petId) || pets[0]!;

  useEffect(() => {
    let isMounted = true;
    mobileApi
      .getMedicalRecordsByPet(petId)
      .then((records: any[]) => {
        if (isMounted && Array.isArray(records) && records.length > 0) {
          const mappedVaccines = records
            .filter((r) => r.vaccine_lot_applied)
            .map((r, idx) => ({
              id: `v_real_${r.id || idx}`,
              petId: petId,
              name: r.vaccine_lot_applied.split("-")[0] || "Imunização Essencial",
              appliedAt: r.vet_signed_at
                ? new Date(r.vet_signed_at).toLocaleDateString("pt-BR")
                : "Data registrada",
              nextDose: "Em 1 ano",
              lot: r.vaccine_lot_applied,
              vet: r.veterinarian?.full_name || "Veterinário PetPrev",
            }));
          if (mappedVaccines.length > 0) {
            setVaccinesList(mappedVaccines);
          }
        }
      })
      .catch(() => {
        // Fallback para lista seed
      });
    return () => {
      isMounted = false;
    };
  }, [petId]);

  const downloadPrescription = (id: string) => {
    const rx = prescriptions.find((p) => p.id === id)!;
    const rows = rx.items
      .map((i) => `<tr><td>${i.drug}</td><td>${i.dosage}</td><td>${i.duration}</td></tr>`)
      .join("");
    printDocument(
      `Receita ${pet.name} ${rx.date}`,
      `
      <h1>Receituário Veterinário</h1>
      <p class="muted">VetCampo · Atendimento domiciliar</p>
      <p><strong>Paciente:</strong> ${pet.name} (${pet.species}, ${pet.breed})<br/>
      <strong>Tutor:</strong> Ana Ribeiro<br/>
      <strong>Data:</strong> ${rx.date}</p>
      <table><thead><tr><th>Medicamento</th><th>Posologia</th><th>Duração</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <footer>${rx.vet} — ${rx.crmv}</footer>
    `,
    );
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
          {vaccinesList
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
              printDocument(
                `Carteira de vacinacao ${pet.name}`,
                `
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
              `,
              )
            }
          >
            <Download className="size-4" /> Baixar carteira em PDF
          </Button>
        </TabsContent>

        <TabsContent value="historico" className="space-y-2 pt-4">
          {clinicalHistory
            .filter((h) => h.petId === petId)
            .map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">{entry.date}</p>
                <p className="text-sm font-semibold">{entry.title}</p>
                <p className="text-sm text-muted-foreground">{entry.summary}</p>
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold hover:bg-accent active:scale-[0.98] transition-all">
                      <CheckCircle2 className="size-4" /> Ver documento completo
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[calc(100vw-2rem)] rounded-2xl max-h-[90vh] flex flex-col p-4">
                    <DialogHeader className="flex flex-row items-center justify-between border-b pb-4 shrink-0 text-left">
                      <div>
                        <DialogTitle>Documento Clínico</DialogTitle>
                        <DialogDescription className="text-xs">Assinado por PetPrev</DialogDescription>
                      </div>
                      <div className="flex items-center gap-1">
                        <button className="p-2 hover:bg-accent rounded-lg text-muted-foreground"><Download className="size-4" /></button>
                      </div>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto pt-4 pb-2">
                      <div className="bg-white rounded-lg shadow-sm border border-border p-4 text-black text-sm">
                        <div className="border-b border-primary pb-3 mb-3">
                          <h2 className="text-lg font-serif font-bold text-primary">PetPrev</h2>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">Clínica Veterinária</p>
                          <div className="mt-2 text-xs text-gray-600">
                            <p>{entry.date}</p>
                            <p>Paciente: {pet?.name}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-4 text-gray-800">
                          <div>
                            <h3 className="font-bold mb-1">{entry.title}</h3>
                            <p className="text-xs">{entry.summary}</p>
                          </div>
                          
                          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <h4 className="font-bold text-xs mb-1 text-gray-900">Evolução Clínica / Receituário</h4>
                            <p className="text-xs">Evolução satisfatória. Manter repouso.</p>
                            <ul className="list-disc pl-4 mt-2 space-y-1 text-xs">
                              <li>Dipirona 500mg - 1 comp. 12/12h</li>
                              <li>Limpeza com soro fisiológico</li>
                            </ul>
                          </div>
                          
                          <div className="mt-6 pt-4 text-center border-t border-gray-200">
                            <p className="font-script text-lg text-blue-900 italic mb-1">Assinado digitalmente</p>
                            <p className="font-bold text-xs">Dra. Camila Souza</p>
                            <p className="text-[10px] text-gray-500">CRMV-BA 12345</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
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
