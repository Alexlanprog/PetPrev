import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { celulasH3, type CelulaH3 } from "@/lib/petprev-data";

export const Route = createFileRoute("/mapa")({
  component: Mapa,
  head: () => ({
    meta: [
      { title: "Mapa de atendimentos H3 · PetPrev Admin" },
      {
        name: "description",
        content:
          "Atendimentos da rede PetPrev agrupados por células hexagonais H3, com densidade e conflitos por região.",
      },
      { property: "og:title", content: "Mapa de atendimentos H3 · PetPrev Admin" },
      {
        property: "og:description",
        content: "Densidade de atendimentos por célula H3 na região metropolitana.",
      },
    ],
  }),
});

const R = 52;
const W = Math.sqrt(3) * R;

function center(cell: CelulaH3) {
  const x = 90 + cell.col * W + (cell.row % 2 ? W / 2 : 0);
  const y = 80 + cell.row * R * 1.5;
  return { x, y };
}

function hexPoints(cx: number, cy: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 90);
    return `${cx + R * Math.cos(a)},${cy + R * Math.sin(a)}`;
  }).join(" ");
}

const max = Math.max(...celulasH3.map((c) => c.atendimentos));

function Mapa() {
  const [ativa, setAtiva] = useState<CelulaH3>(celulasH3[2] as CelulaH3);

  return (
    <AdminShell
      title="Mapa de atendimentos (H3)"
      subtitle="Agrupamento espacial por índices H3 · resolução 10 · janela de 7 dias"
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Densidade por célula</CardTitle>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              baixa
              <span className="h-2 w-24 rounded-full bg-gradient-to-r from-primary/15 to-primary" />
              alta
            </div>
          </CardHeader>
          <CardContent>
            <svg viewBox="0 0 520 420" className="w-full">
              {celulasH3.map((cell) => {
                const { x, y } = center(cell);
                const intensity = 0.15 + (cell.atendimentos / max) * 0.85;
                const selected = ativa.h3 === cell.h3;
                return (
                  <g
                    key={cell.h3}
                    onClick={() => setAtiva(cell)}
                    className="cursor-pointer transition-opacity hover:opacity-90"
                  >
                    <polygon
                      points={hexPoints(x, y)}
                      fill="var(--color-primary)"
                      fillOpacity={intensity}
                      stroke={selected ? "var(--color-foreground)" : "var(--color-border)"}
                      strokeWidth={selected ? 3 : 1.5}
                    />
                    <text
                      x={x}
                      y={y - 2}
                      textAnchor="middle"
                      className="fill-foreground text-[13px] font-semibold"
                    >
                      {cell.atendimentos}
                    </text>
                    <text
                      x={x}
                      y={y + 14}
                      textAnchor="middle"
                      className="fill-muted-foreground text-[9px]"
                    >
                      {cell.bairro}
                    </text>
                  </g>
                );
              })}
            </svg>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{ativa.bairro}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="font-mono text-xs break-all text-muted-foreground">{ativa.h3}</p>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl font-semibold">{ativa.atendimentos}</span>
                <span className="text-muted-foreground">atendimentos</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={ativa.conflitos > 0 ? "destructive" : "secondary"}>
                  {ativa.conflitos} prontuários com conflito
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Participação na rede:{" "}
                {(
                  (ativa.atendimentos / celulasH3.reduce((s, c) => s + c.atendimentos, 0)) *
                  100
                ).toFixed(1)}
                %
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ranking de células</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[...celulasH3]
                .sort((a, b) => b.atendimentos - a.atendimentos)
                .slice(0, 6)
                .map((c) => (
                  <button
                    key={c.h3}
                    onClick={() => setAtiva(c)}
                    className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
                  >
                    <span>{c.bairro}</span>
                    <span className="font-medium">{c.atendimentos}</span>
                  </button>
                ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
