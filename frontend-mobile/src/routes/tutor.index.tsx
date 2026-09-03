import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Syringe, CalendarPlus, MessageCircle, ChevronRight, ShieldCheck } from "lucide-react";
import { pets, vaccines, visits, petById } from "@/lib/tutor-data";

export const Route = createFileRoute("/tutor/")({
  head: () => ({
    meta: [
      { title: "Home · App do Tutor VetCampo" },
      {
        name: "description",
        content:
          "Acompanhe o próximo atendimento domiciliar, o status de vacinação dos seus pets e acesse atalhos rápidos.",
      },
      { property: "og:title", content: "Home · App do Tutor VetCampo" },
      {
        property: "og:description",
        content: "Próximo atendimento, resumo dos pets e status de vacinação em um só lugar.",
      },
    ],
  }),
  component: TutorHome,
});

function TutorHome() {
  const next = visits.find((v) => v.status !== "concluida");
  const nextPet = next ? petById(next.petId) : undefined;
  const pending = vaccines.filter((v) => !petById(v.petId)?.vaccinesUpToDate).length;

  return (
    <main className="space-y-6 px-4 pt-8">
      <header>
        <p className="field-label">Bem-vinda de volta</p>
        <h1 className="text-2xl font-bold tracking-tight">Olá, Ana</h1>
      </header>

      {next && (
        <section className="rounded-2xl bg-primary p-5 text-primary-foreground shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
            Próximo atendimento
          </p>
          <p className="mt-1 text-lg font-bold">
            {next.date} às {next.time}
          </p>
          <p className="text-sm opacity-90">
            {nextPet?.name} · {next.reason}
          </p>
          <p className="text-sm opacity-90">{next.vet}</p>
          {next.status === "a_caminho" && (
            <Link
              to="/tutor/agenda"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-foreground/15 px-3 py-2 text-sm font-semibold"
            >
              <MapPin className="size-4" /> Veterinária a caminho · rastrear
            </Link>
          )}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="field-label">Meus pets</h2>
        <div className="grid grid-cols-2 gap-3">
          {pets.map((pet) => (
            <Link
              key={pet.id}
              to="/tutor/pets"
              className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]"
            >
              <span className="text-3xl">{pet.emoji}</span>
              <p className="mt-2 font-semibold">{pet.name}</p>
              <p className="text-xs text-muted-foreground">
                {pet.breed} · {pet.age}
              </p>
              <span
                className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  pet.vaccinesUpToDate
                    ? "bg-success/15 text-success"
                    : "bg-warning/20 text-warning-foreground"
                }`}
              >
                <ShieldCheck className="size-3" />
                {pet.vaccinesUpToDate ? "Vacinas em dia" : "Reforço pendente"}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="field-label">Status da vacinação</h2>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">
              <Syringe className="size-5" />
            </span>
            <div className="flex-1">
              <p className="font-semibold">
                {pending === 0 ? "Tudo em dia" : `${pending} dose(s) a vencer`}
              </p>
              <p className="text-xs text-muted-foreground">
                Mia · reforço V4 e antirrábica em 02/07/2026
              </p>
            </div>
            <Link to="/tutor/prontuario">
              <ChevronRight className="size-5 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="field-label">Atalhos rápidos</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/tutor/agenda"
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm font-medium"
          >
            <CalendarPlus className="size-5 text-primary" /> Agendar visita
          </Link>
          <Link
            to="/tutor/assinatura"
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm font-medium"
          >
            <MessageCircle className="size-5 text-primary" /> Falar com suporte
          </Link>
        </div>
      </section>
    </main>
  );
}
