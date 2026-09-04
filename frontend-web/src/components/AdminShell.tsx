import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, ShieldCheck, Hexagon, PawPrint, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@petprev/utils";
import { useAuth } from "@/lib/auth-context";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/auditoria", label: "Auditoria do RT", icon: ShieldCheck },
  { to: "/mapa", label: "Mapa H3", icon: Hexagon },
] as const;

export function AdminShell({
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
            <p className="text-xs text-muted-foreground">Painel administrativo</p>
          </div>
        </div>

        <nav className="mt-8 flex flex-col gap-1">
          {nav.map((item) => {
            const active = pathname === item.to;
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

        <div className="mt-auto space-y-2">
          <div className="rounded-xl border border-border bg-card p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">{user?.name ?? "Usuário"}</p>
            <p>{user?.roleLabel ?? ""} · {user?.credential ?? ""}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl border border-border/60 px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive"
          >
            <LogOut className="size-3.5" />
            Sair da conta
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-border bg-card/60 px-6 py-5 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            </div>
            <button onClick={handleLogout} className="md:hidden flex items-center justify-center p-2 text-destructive hover:bg-destructive/10 rounded-lg">
              <LogOut className="size-5" />
            </button>
          </div>
          <nav className="mt-4 flex gap-2 md:hidden overflow-x-auto pb-1">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium",
                  pathname === item.to
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
