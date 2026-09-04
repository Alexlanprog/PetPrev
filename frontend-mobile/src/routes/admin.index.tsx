import { createFileRoute } from "@tanstack/react-router";
import { Users, TrendingUp, Stethoscope, AlertTriangle, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
  head: () => ({
    meta: [{ title: "Admin Mobile · PetPrev" }],
  }),
});

// Mocked data mirroring Web admin
const kpis = [
  {
    label: "Assinaturas ativas",
    value: "4.812",
    delta: "+3,4% vs. mês anterior",
    icon: Users,
  },
  {
    label: "MRR",
    value: "R$ 312.480",
    delta: "+11,0% vs. mês anterior",
    icon: TrendingUp,
  },
  {
    label: "Atendimentos do dia",
    value: "88",
    delta: "21 em andamento",
    icon: Stethoscope,
  },
];

const mrrSerie = [
  { mes: "Jan", mrr: 150 },
  { mes: "Fev", mrr: 165 },
  { mes: "Mar", mrr: 180 },
  { mes: "Abr", mrr: 210 },
  { mes: "Mai", mrr: 245 },
  { mes: "Jun", mrr: 270 },
  { mes: "Jul", mrr: 312 },
];

const prontuariosConflito = [
  { id: "PRN-1092", pet: "Rex (Labrador)", motivo: "Dosagem de antibiótico 50% acima do protocolo padrão." },
  { id: "PRN-1094", pet: "Nina (Persa)", motivo: "Sem anotação de temperatura pré-vacinal." },
];

function AdminDashboard() {
  const { logout, user } = useAuth();

  return (
    <main className="space-y-6 px-4 pt-8">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider text-indigo-600 uppercase">Gestão da Rede</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Olá, {user?.name?.split(" ")[1] || "Helena"}</h1>
        </div>
        <button onClick={logout} className="flex size-9 items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors">
          <LogOut className="size-4" />
        </button>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-3">
        {kpis.map((kpi, idx) => (
          <div key={idx} className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${idx === 1 ? 'col-span-2' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">{kpi.label}</span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <kpi.icon className="size-3.5" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900">{kpi.value}</p>
            <p className="mt-1 text-[10px] text-slate-500">{kpi.delta}</p>
          </div>
        ))}
      </section>

      {/* Chart */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Evolução de MRR (R$ mil)</h2>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mrrSerie}>
              <defs>
                <linearGradient id="mrr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                labelStyle={{ color: "#64748b", fontSize: 12, marginBottom: 4 }}
                itemStyle={{ color: "#4f46e5", fontWeight: "bold" }}
              />
              <Area type="monotone" dataKey="mrr" stroke="#4f46e5" strokeWidth={3} fill="url(#mrr)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Alerts */}
      <section className="space-y-3 pb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Sinalizações do RT</h2>
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">2 pendências</span>
        </div>
        
        {prontuariosConflito.map(p => (
          <div key={p.id} className="rounded-xl border border-red-200 bg-red-50 p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="size-4 text-red-600" />
              <span className="text-sm font-semibold text-slate-900">{p.id} · {p.pet}</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed ml-6">{p.motivo}</p>
            <button 
              onClick={() => toast.success("Sinalização resolvida com sucesso!")}
              className="ml-6 mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Resolver conflito →
            </button>
          </div>
        ))}
      </section>

    </main>
  );
}
