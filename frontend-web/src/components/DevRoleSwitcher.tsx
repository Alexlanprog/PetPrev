import { useState, useEffect } from "react";
import { UserCheck, Stethoscope, ShieldCheck, Database, FileCode2, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@petprev/ui";

export function DevRoleSwitcher() {
  const [open, setOpen] = useState(false);
  const [activeRole, setActiveRole] = useState<"tutor" | "vet" | "rt">("rt");
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("petprev_demo_role");
    if (saved === "vet" || saved === "rt" || saved === "tutor") {
      setActiveRole(saved);
    }
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const baseUrl = (typeof window !== "undefined" && (import.meta as any).env?.["VITE_API_BASE_URL"])
        ? (import.meta as any).env["VITE_API_BASE_URL"].replace(/\/$/, "")
        : "http://localhost:3000/api/v1";

      const res = await fetch(`${baseUrl}/dev/seed`, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();

      if (json.data?.tutor?.token) {
        localStorage.setItem("petprev_demo_tutor_token", json.data.tutor.token);
      }
      if (json.data?.vet?.token) {
        localStorage.setItem("petprev_demo_vet_token", json.data.vet.token);
      }
      if (json.data?.rt?.token) {
        localStorage.setItem("petprev_demo_rt_token", json.data.rt.token);
        localStorage.setItem("petprev_auth_token", json.data.rt.token);
      }

      toast.success("Carga de demonstração criada com sucesso!", {
        description: "Tutor Ana Ribeiro, Pets Thor & Mia, Dra. Camila e agendamentos carregados.",
      });

      setTimeout(() => window.location.reload(), 1200);
    } catch (err: any) {
      toast.error("Erro ao popular dados de demo", {
        description: err.message || "Verifique se o backend está ativo na porta 3000.",
      });
    } finally {
      setSeeding(false);
    }
  };

  const applyRole = (role: "tutor" | "vet" | "rt") => {
    setActiveRole(role);
    localStorage.setItem("petprev_demo_role", role);

    const tutorToken = localStorage.getItem("petprev_demo_tutor_token") || "DEMO_TUTOR_TOKEN";
    const vetToken = localStorage.getItem("petprev_demo_vet_token") || "DEMO_VET_TOKEN";
    const rtToken = localStorage.getItem("petprev_demo_rt_token") || "DEMO_RT_TOKEN";

    if (role === "rt") {
      localStorage.setItem("petprev_auth_token", rtToken);
      toast.info("Perfil ativo: Responsável Técnico (Dra. Helena)");
      window.location.href = "/auditoria";
    } else if (role === "tutor") {
      localStorage.setItem("petprev_auth_token", tutorToken);
      toast.info("Abrindo visualização do Tutor no App Mobile...");
      window.open("http://localhost:5174/tutor", "_blank");
    } else {
      localStorage.setItem("petprev_auth_token", vetToken);
      toast.info("Abrindo visualização do Veterinário de Campo...");
      window.open("http://localhost:5174", "_blank");
    }
  };

  return (
    <aside aria-label="Alternador de Perfis para Demonstração" className="fixed bottom-3 right-3 z-50">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full border border-primary/30 bg-card/95 px-3.5 py-2 text-xs font-semibold text-foreground shadow-lg backdrop-blur hover:bg-accent"
        >
          <span className="size-2 rounded-full bg-success animate-pulse" />
          <span>Demo: {activeRole === "rt" ? "🛡️ RT / Auditoria" : activeRole === "tutor" ? "👤 Tutor" : "🩺 Vet"}</span>
          <ChevronUp className="size-3 text-muted-foreground" />
        </button>
      ) : (
        <div className="w-80 rounded-2xl border border-border bg-card/95 p-3.5 shadow-2xl backdrop-blur">
          <div className="mb-2.5 flex items-center justify-between border-b border-border/60 pb-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">Modo de Demonstração</p>
              <p className="text-[11px] text-muted-foreground">Alternador rápido de papéis</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <ChevronDown className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5 mb-3">
            <button
              onClick={() => applyRole("rt")}
              className={`flex flex-col items-center justify-center rounded-xl p-2 text-center text-xs font-medium transition-colors ${
                activeRole === "rt"
                  ? "bg-primary text-primary-foreground font-semibold shadow"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              <ShieldCheck className="size-4 mb-1" />
              <span>RT / Admin</span>
            </button>

            <button
              onClick={() => applyRole("tutor")}
              className={`flex flex-col items-center justify-center rounded-xl p-2 text-center text-xs font-medium transition-colors ${
                activeRole === "tutor"
                  ? "bg-primary text-primary-foreground font-semibold shadow"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              <UserCheck className="size-4 mb-1" />
              <span>Tutor</span>
            </button>

            <button
              onClick={() => applyRole("vet")}
              className={`flex flex-col items-center justify-center rounded-xl p-2 text-center text-xs font-medium transition-colors ${
                activeRole === "vet"
                  ? "bg-primary text-primary-foreground font-semibold shadow"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              <Stethoscope className="size-4 mb-1" />
              <span>Vet Campo</span>
            </button>
          </div>

          <div className="space-y-1.5 pt-1 border-t border-border/60">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 text-xs"
              onClick={handleSeed}
              disabled={seeding}
            >
              <Database className="size-3.5 text-primary" />
              <span>{seeding ? "Carregando cenário..." : "Popular Dados Demo (Seed)"}</span>
            </Button>

            <a
              href="http://localhost:3000/api/docs"
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-between rounded-lg border border-border bg-background/50 px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <span className="flex items-center gap-2">
                <FileCode2 className="size-3.5 text-chart-2" />
                <span>Swagger Docs (/api/docs)</span>
              </span>
              <ExternalLink className="size-3" />
            </a>

            <a
              href="http://localhost:5174/tutor"
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-between rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <span>Abrir App Mobile / Tutor (Porta 5174)</span>
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      )}
    </aside>
  );
}
