import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Weight, Cake, Stethoscope } from "lucide-react";
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
} from "@petprev/ui";
import { pets as seedPets, clinicalHistory, type Pet } from "@/lib/tutor-data";

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
              <Button
                variant="secondary"
                size="sm"
                className="mt-3 w-full gap-2"
                onClick={() => setExpanded(isOpen ? null : pet.id)}
              >
                <Stethoscope className="size-4" />
                {isOpen ? "Ocultar prontuário" : "Ver prontuário completo"}
              </Button>
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
