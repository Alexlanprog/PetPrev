import { createFileRoute } from "@tanstack/react-router";
import { TutorShell } from "@/components/TutorShell";
import { pets, vaccines } from "@/lib/tutor-data";
import { Bone, Weight, Cake, Syringe, QrCode, ShieldCheck } from "lucide-react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger 
} from "@petprev/ui";

export const Route = createFileRoute("/tutor/pets")({
  component: TutorPets,
});

function TutorPets() {
  return (
    <TutorShell title="Meus Pets" subtitle="Gerencie as informações dos seus companheiros.">
      <div className="grid gap-6 md:grid-cols-2">
        {pets.map((pet) => (
          <div key={pet.id} className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-primary/5 p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
                  {pet.emoji}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{pet.name}</h3>
                  <p className="text-sm text-muted-foreground">{pet.breed}</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${pet.vaccinesUpToDate ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                {pet.vaccinesUpToDate ? "Vacinas em dia" : "Vacina pendente"}
              </div>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-accent text-muted-foreground">
                  <Bone className="size-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Espécie</p>
                  <p className="text-sm font-semibold">{pet.species}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-accent text-muted-foreground">
                  <Cake className="size-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Idade</p>
                  <p className="text-sm font-semibold">{pet.age}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-accent text-muted-foreground">
                  <Weight className="size-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Peso</p>
                  <p className="text-sm font-semibold">{pet.weight}</p>
                </div>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <div className="flex items-center gap-3 cursor-pointer group">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-accent text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <Syringe className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Próxima Vacina</p>
                      <p className="text-sm font-semibold text-primary group-hover:underline">Ver carteirinha</p>
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Carteira de Vacinação</DialogTitle>
                    <DialogDescription>
                      Documento digital oficial PetPrev
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4 rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <QrCode className="size-24" />
                    </div>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex size-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm border border-border">
                        {pet.emoji}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{pet.name}</h3>
                        <p className="text-sm text-muted-foreground">{pet.species} · {pet.breed}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 relative z-10">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Histórico de Vacinas</h4>
                      {vaccines.filter(v => v.petId === pet.id).map(v => (
                        <div key={v.id} className="flex items-start gap-3 rounded-lg bg-white p-3 shadow-sm border border-border">
                          <ShieldCheck className="size-5 text-success mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{v.name}</p>
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                              <span>Aplicada: {v.appliedAt}</span>
                              <span className="text-primary font-medium">Reforço: {v.nextDose}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">Lote: {v.lot} · {v.vet}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        ))}
      </div>
    </TutorShell>
  );
}
