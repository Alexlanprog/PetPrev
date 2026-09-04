import { createFileRoute } from "@tanstack/react-router";
import { Users, TrendingUp, Stethoscope, AlertTriangle } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminShell } from "@/components/AdminShell";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@petprev/ui";
import { atendimentosHora, mrrSerie, prontuarios } from "@/lib/petprev-data";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Dashboard de KPIs · PetPrev Admin" },
      {
        name: "description",
        content:
          "Acompanhe assinaturas ativas, MRR e atendimentos do dia da rede PetPrev em um painel único.",
      },
      { property: "og:title", content: "Dashboard de KPIs · PetPrev Admin" },
      {
        property: "og:description",
        content: "Assinaturas ativas, MRR e atendimentos do dia da rede PetPrev.",
      },
    ],
  }),
});

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
    delta: "21 em andamento agora",
    icon: Stethoscope,
  },
];

function Dashboard() {
  const conflitos = prontuarios.filter((p) => p.has_conflict).length;

  return (
    <AdminShell
      title="Dashboard de KPIs"
      subtitle="Visão executiva da rede PetPrev · atualizado há 4 minutos"
    >
      <div className="grid gap-4 md:grid-cols-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-border/70">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.label}
              </CardTitle>
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <kpi.icon className="size-4" />
              </span>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl font-semibold tracking-tight">{kpi.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{kpi.delta}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Evolução do MRR (R$ mil)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mrrSerie}>
                <defs>
                  <linearGradient id="mrr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  vertical={false}
                />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={36} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="mrr"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fill="url(#mrr)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Sinalizações do RT</CardTitle>
            <Badge variant="destructive">{conflitos} conflitos</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {prontuarios
              .filter((p) => p.has_conflict)
              .slice(0, 3)
              .map((p) => (
                <div
                  key={p.id}
                  className="rounded-lg border border-destructive/30 bg-destructive/5 p-3"
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <AlertTriangle className="size-4 text-destructive" />
                    {p.id} · {p.pet}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{p.motivo}</p>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Atendimentos por faixa horária (hoje)</CardTitle>
        </CardHeader>
        <CardContent className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={atendimentosHora}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="hora" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} width={28} />
              <Tooltip
                cursor={{ fill: "var(--color-muted)" }}
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="total" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
