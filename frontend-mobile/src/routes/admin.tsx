import { Outlet, createFileRoute, Link, redirect } from "@tanstack/react-router";
import { LayoutDashboard, Users, UserCog, Settings } from "lucide-react";

export const Route = createFileRoute("/admin")({
  beforeLoad: () => {
    const role = typeof window !== "undefined" ? localStorage.getItem("petprev_demo_role") : null;
    if (role !== "rt") {
      throw redirect({ to: "/" });
    }
  },
  component: AdminLayout,
});

const tabs = [
  { to: "/admin", label: "Painel", icon: LayoutDashboard, exact: true },
  { to: "/admin/equipe", label: "Equipe", icon: UserCog, exact: false },
  { to: "/admin/tutores", label: "Tutores", icon: Users, exact: false },
  { to: "/admin/config", label: "Ajustes", icon: Settings, exact: false },
] as const;

function AdminLayout() {
  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-slate-50 pb-24 text-slate-900">
      <Outlet />
      <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 border-t border-slate-200 bg-white/95 backdrop-blur">
        <ul className="grid grid-cols-4">
          {tabs.map(({ to, label, icon: Icon, exact }) => (
            <li key={to}>
              <Link
                to={to}
                activeOptions={{ exact }}
                activeProps={{ "data-active": "true" }}
                className="flex flex-col items-center gap-1 px-1 py-3 text-[11px] font-medium text-slate-500 data-[active=true]:text-indigo-600 transition-colors"
                onClick={(e) => {
                  if (to !== "/admin") {
                    e.preventDefault();
                    import("sonner").then(({ toast }) => toast.info("Em breve no MVP"));
                  }
                }}
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
