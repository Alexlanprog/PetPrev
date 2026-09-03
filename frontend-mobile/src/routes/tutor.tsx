import { Outlet, createFileRoute, Link } from "@tanstack/react-router";
import { Home, PawPrint, CalendarDays, FileText, CreditCard } from "lucide-react";

export const Route = createFileRoute("/tutor")({
  component: TutorLayout,
});

const tabs = [
  { to: "/tutor", label: "Home", icon: Home, exact: true },
  { to: "/tutor/pets", label: "Meus Pets", icon: PawPrint, exact: false },
  { to: "/tutor/agenda", label: "Agenda", icon: CalendarDays, exact: false },
  { to: "/tutor/prontuario", label: "Prontuário", icon: FileText, exact: false },
  { to: "/tutor/assinatura", label: "Assinatura", icon: CreditCard, exact: false },
] as const;

function TutorLayout() {
  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-background pb-24">
      <Outlet />
      <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 border-t border-border bg-card/95 backdrop-blur">
        <ul className="grid grid-cols-5">
          {tabs.map(({ to, label, icon: Icon, exact }) => (
            <li key={to}>
              <Link
                to={to}
                activeOptions={{ exact }}
                activeProps={{ "data-active": "true" }}
                className="flex flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-medium text-muted-foreground data-[active=true]:text-primary"
              >
                <Icon className="size-5" />
                <span className="truncate">{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
