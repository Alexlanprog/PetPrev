import { createFileRoute } from "@tanstack/react-router";
import { TutorShell } from "@/components/TutorShell";
import { clinicalHistory, petById } from "@/lib/tutor-data";
import { FileText, Calendar, CheckCircle2, Download, Printer } from "lucide-react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger 
} from "@petprev/ui";

export const Route = createFileRoute("/tutor/prontuario")({
  component: TutorProntuario,
});

function TutorProntuario() {
  return (
    <TutorShell title="Prontuários" subtitle="Histórico clínico dos seus pets.">
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {clinicalHistory.map((entry) => {
            const pet = petById(entry.petId);
            return (
              <div key={entry.id} className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileText className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-bold">{entry.title}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="size-3" /> {entry.date}
                    </p>
                  </div>
                </div>
                
                <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent text-sm w-fit">
                  <span className="text-base">{pet?.emoji}</span>
                  <span className="font-medium">{pet?.name}</span>
                </div>
                
                <p className="text-sm text-muted-foreground flex-1 mb-6">
                  {entry.summary}
                </p>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-accent transition-colors">
                      <CheckCircle2 className="size-4" /> Ver documento completo
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                    <DialogHeader className="flex flex-row items-center justify-between border-b pb-4 shrink-0">
                      <div>
                        <DialogTitle>Documento Clínico</DialogTitle>
                        <DialogDescription>Assinado digitalmente por PetPrev</DialogDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-accent rounded-lg text-muted-foreground transition-colors"><Printer className="size-4" /></button>
                        <button className="p-2 hover:bg-accent rounded-lg text-muted-foreground transition-colors"><Download className="size-4" /></button>
                      </div>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto p-6 bg-accent/30">
                      <div className="bg-white rounded-sm shadow-sm border border-border p-8 min-h-[500px] text-black">
                        <div className="flex justify-between items-start border-b-2 border-primary pb-6 mb-6">
                          <div>
                            <h2 className="text-2xl font-serif font-bold text-primary">PetPrev</h2>
                            <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Clínica Veterinária</p>
                          </div>
                          <div className="text-right text-sm text-gray-600">
                            <p>Data: {entry.date}</p>
                            <p>Paciente: {pet?.name} ({pet?.species})</p>
                            <p>Tutor: Ana</p>
                          </div>
                        </div>
                        
                        <div className="space-y-6 text-sm leading-relaxed text-gray-800">
                          <div>
                            <h3 className="font-bold text-lg mb-2">{entry.title}</h3>
                            <p>{entry.summary}</p>
                          </div>
                          
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <h4 className="font-bold mb-2 text-gray-900">Evolução Clínica / Receituário</h4>
                            <p>Paciente apresentou evolução satisfatória ao tratamento instituído. Recomendo manter o repouso por mais 3 dias.</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                              <li>Dipirona 500mg - 1 comprimido a cada 12h (5 dias)</li>
                              <li>Limpeza do local com soro fisiológico 2x ao dia</li>
                            </ul>
                          </div>
                          
                          <div className="mt-12 pt-8 flex flex-col items-center border-t border-gray-200 w-64 mx-auto">
                            <div className="w-full text-center">
                              <p className="font-script text-2xl text-blue-900 italic mb-2">Dr(a). Veterinário(a)</p>
                              <p className="font-bold">Dra. Camila Souza</p>
                              <p className="text-xs text-gray-500">CRMV-BA 12345</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            );
          })}
        </div>
      </div>
    </TutorShell>
  );
}
