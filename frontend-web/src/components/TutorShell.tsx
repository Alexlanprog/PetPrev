import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, PawPrint, CalendarDays, FileText, CreditCard, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@petprev/utils";
import { useAuth } from "@/lib/auth-context";

const nav = [
  { to: "/tutor", label: "Resumo", icon: LayoutDashboard },
  { to: "/tutor/pets", label: "Meus Pets", icon: PawPrint },
  { to: "/tutor/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/tutor/prontuario", label: "Prontuário", icon: FileText },
  { to: "/tutor/assinatura", label: "Assinatura", icon: CreditCard },
] as const;

export function TutorShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-sidebar px-4 py-6 md:flex">
        <div className="flex items-center gap-2 px-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <PawPrint className="size-5" />
          </span>
          <div className="leading-tight">
            <p className="font-display text-lg font-semibold tracking-tight">PetPrev</p>
            <p className="text-xs text-muted-foreground">Portal do Tutor</p>
          </div>
        </div>

        <nav className="mt-8 flex flex-col gap-1">
          {nav.map((item) => {
            const active = pathname === item.to || (item.to !== "/tutor" && pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="size-4" />
            Sair da conta
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/80 px-4 py-3 backdrop-blur md:hidden">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <PawPrint className="size-4" />
            </span>
            <span className="font-display font-semibold">PetPrev Tutor</span>
          </div>
          <button onClick={handleLogout} className="p-2 text-destructive">
            <LogOut className="size-5" />
          </button>
        </header>

        <main className="flex-1 overflow-x-hidden p-4 md:p-8">
          <div className="mx-auto max-w-5xl">
            <header className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              </div>
              <div className="hidden items-center gap-3 md:flex">
                <div className="text-right leading-tight">
                  <p className="text-sm font-medium">{user?.name || "Tutor"}</p>
                  <p className="text-xs text-muted-foreground">{user?.credential}</p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                  {user?.name.charAt(0) || "T"}
                </div>
              </div>
            </header>
            <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
