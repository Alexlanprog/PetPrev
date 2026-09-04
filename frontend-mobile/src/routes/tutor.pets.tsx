import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Weight, Cake, Stethoscope, Syringe, QrCode, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  Input,
  Label,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@petprev/ui";
import { pets as seedPets, clinicalHistory, vaccines, type Pet } from "@/lib/tutor-data";

import { useEffect } from "react";
import { mobileApi } from "@/lib/api-client";

export const Route = createFileRoute("/tutor/pets")({
  head: () => ({
    meta: [
      { title: "Meus Pets · App do Tutor VetCampo" },
      {
        name: "description",
        content:
          "Veja todos os pets cadastrados, adicione um novo pet e acesse o prontuário completo de cada um.",
      },
      { property: "og:title", content: "Meus Pets · App do Tutor VetCampo" },
      {
        property: "og:description",
        content: "Cadastro de pets e prontuário completo na palma da mão.",
      },
    ],
  }),
  component: MyPets,
});

function MyPets() {
  const [pets, setPets] = useState<Pet[]>(seedPets);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", breed: "", age: "", weight: "" });

  useEffect(() => {
    let isMounted = true;
    mobileApi
      .getPets()
      .then((serverPets: any[]) => {
        if (isMounted && Array.isArray(serverPets) && serverPets.length > 0) {
          const mapped: Pet[] = serverPets.map((p) => ({
            id: p.id,
            name: p.name,
            species: p.species === "FELINE" ? "Gato" : "Cão",
            breed: p.breed || "Sem raça definida",
            age: p.birth_date
              ? `${new Date().getFullYear() - new Date(p.birth_date).getFullYear()} anos`
              : "—",
            weight: p.weight_kg ? `${p.weight_kg} kg` : "—",
            emoji: p.species === "FELINE" ? "🐈" : "🐕",
            vaccinesUpToDate: true,
          }));
          setPets(mapped);
        }
      })
      .catch(() => {
        // Fallback para dados locais
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const addPet = async () => {
    if (!form.name.trim()) {
      toast.error("Informe o nome do pet.");
      return;
    }

    const newPetLocal: Pet = {
      id: `p${pets.length + 1}`,
      name: form.name,
      species: "Cão",
      breed: form.breed || "Sem raça definida",
      age: form.age || "—",
      weight: form.weight || "—",
      emoji: "🐾",
      vaccinesUpToDate: false,
    };

    setPets((prev) => [...prev, newPetLocal]);

    // Enviar para o backend se disponível
    try {
      const weightNum = parseFloat(form.weight.replace(",", "."));
      const petPayload: Parameters<typeof mobileApi.createPet>[0] = {
        name: form.name,
        species: "CANINE",
        breed: form.breed || "SRD",
        gender: "M",
        birth_date: new Date().toISOString().split("T")[0],
      };
      if (!isNaN(weightNum)) {
        petPayload.weight_kg = weightNum;
      }
      await mobileApi.createPet(petPayload);
      toast.success("Pet cadastrado e sincronizado!");
    } catch {
      toast.success("Pet salvo localmente (modo offline).");
    }

    setForm({ name: "", breed: "", age: "", weight: "" });
    setOpen(false);
  };

  return (
    <main className="space-y-5 px-4 pt-8">
      <header className="flex items-end justify-between">
        <div>
          <p className="field-label">Cadastro</p>
          <h1 className="text-2xl font-bold tracking-tight">Meus pets</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="size-4" /> Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[92vw] rounded-2xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar pet</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {(
                [
                  ["name", "Nome"],
                  ["breed", "Raça"],
                  ["age", "Idade"],
                  ["weight", "Peso"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key}>{label}</Label>
                  <Input
                    id={key}
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button onClick={addPet} className="w-full">
                Salvar pet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <ul className="space-y-3">
        {pets.map((pet) => {
          const history = clinicalHistory.filter((h) => h.petId === pet.id);
          const isOpen = expanded === pet.id;
          return (
            <li
              key={pet.id}
              className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-center gap-4">
                <span className="grid size-14 place-items-center rounded-2xl bg-secondary text-3xl">
                  {pet.emoji}
                </span>
                <div className="flex-1">
                  <p className="font-semibold">{pet.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {pet.species} · {pet.breed}
                  </p>
                  <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Cake className="size-3" /> {pet.age}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Weight className="size-3" /> {pet.weight}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-1/2 gap-2 text-primary bg-primary/10 hover:bg-primary/20"
                    >
                      <Syringe className="size-4" />
                      Carteirinha
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[calc(100vw-2rem)] rounded-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Carteira de Vacinação</DialogTitle>
                      <DialogDescription>
                        Documento digital oficial PetPrev
                      </DialogDescription>
                    </DialogHeader>
                    <div className="mt-2 rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-10">
                        <QrCode className="size-16" />
                      </div>
                      <div className="flex items-center gap-3 mb-4 relative z-10">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm border border-border">
                          {pet.emoji}
                        </div>
                        <div>
                          <h3 className="text-base font-bold">{pet.name}</h3>
                          <p className="text-xs text-muted-foreground">{pet.species} · {pet.breed}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3 relative z-10">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Histórico de Vacinas</h4>
                        {vaccines.filter(v => v.petId === pet.id).map(v => (
                          <div key={v.id} className="flex items-start gap-2 rounded-lg bg-white p-2 shadow-sm border border-border">
                            <ShieldCheck className="size-4 text-success mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-xs truncate">{v.name}</p>
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                                <span>Aplicada: {v.appliedAt}</span>
                                <span className="text-primary font-medium">Reforço: {v.nextDose}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="secondary"
                  size="sm"
                  className="w-1/2 gap-2"
                  onClick={() => setExpanded(isOpen ? null : pet.id)}
                >
                  <Stethoscope className="size-4" />
                  {isOpen ? "Ocultar prontuário" : "Prontuário"}
                </Button>
              </div>
              {isOpen && (
                <ul className="mt-3 space-y-2 border-t border-border pt-3">
                  {history.length === 0 && (
                    <li className="text-sm text-muted-foreground">Sem registros clínicos ainda.</li>
                  )}
                  {history.map((entry) => (
                    <li key={entry.id} className="rounded-xl bg-secondary/60 p-3">
                      <p className="text-xs text-muted-foreground">{entry.date}</p>
                      <p className="text-sm font-semibold">{entry.title}</p>
                      <p className="text-sm text-muted-foreground">{entry.summary}</p>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
