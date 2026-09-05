import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, MapPin } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@petprev/ui";
import { celulasH3, type CelulaH3 } from "@/lib/petprev-data";
import { cn } from "@petprev/utils";

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

const R = 48;
const W = Math.sqrt(3) * R;

function center(cell: CelulaH3) {
  const x = 32 + cell.col * W + (cell.row % 2 ? W / 2 : 0);
  const y = 36 + cell.row * R * 1.5;
  return { x, y };
}

function hexPoints(cx: number, cy: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 90);
    return `${cx + R * Math.cos(a)},${cy + R * Math.sin(a)}`;
  }).join(" ");
}

const maxAtendimentos = Math.max(...celulasH3.map((c) => c.atendimentos));
const maxConflitos = Math.max(...celulasH3.map((c) => c.conflitos));

function Mapa() {
  const [ativa, setAtiva] = useState<CelulaH3>(celulasH3[2] as CelulaH3);
  const [modo, setModo] = useState<"densidade" | "conflitos">("densidade");

  const totalAtendimentos = celulasH3.reduce((s, c) => s + c.atendimentos, 0);
  const totalConflitos = celulasH3.reduce((s, c) => s + c.conflitos, 0);

  return (
    <AdminShell
      title="Mapa de atendimentos (H3)"
      subtitle="Agrupamento espacial por índices H3 · resolução 10 · janela de 7 dias"
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">
                {modo === "densidade" ? "Densidade de Atendimentos" : "Focos de Divergência (RT)"}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {modo === "densidade"
                  ? "Volume de atendimentos realizados por célula geográfica"
                  : "Células com registros retidos ou com pendência de auditoria"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-border bg-muted/50 p-0.5 text-xs">
                <button
                  onClick={() => setModo("densidade")}
                  className={cn(
                    "rounded-md px-2.5 py-1 font-medium transition-colors",
                    modo === "densidade"
                      ? "bg-card text-foreground shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Atendimentos
                </button>
                <button
                  onClick={() => setModo("conflitos")}
                  className={cn(
                    "rounded-md px-2.5 py-1 font-medium transition-colors",
                    modo === "conflitos"
                      ? "bg-card text-foreground shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Conflitos RT
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground pl-2 border-l border-border">
                <span>0</span>
                <span
                  className={cn(
                    "h-2 w-16 rounded-full",
                    modo === "densidade"
                      ? "bg-gradient-to-r from-primary/20 to-primary"
                      : "bg-gradient-to-r from-destructive/20 to-destructive",
                  )}
                />
                <span>Max</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-6">
            <div className="rounded-xl border border-border/60 bg-muted/20 p-2">
              <svg viewBox="0 0 520 360" className="w-full h-auto drop-shadow-sm">
                {celulasH3.map((cell) => {
                  const { x, y } = center(cell);
                  const selected = ativa.h3 === cell.h3;

                  // Visual calculations based on active mode
                  let fill = "var(--color-primary)";
                  let intensity = 0.15 + (cell.atendimentos / maxAtendimentos) * 0.85;
                  let isDark = intensity > 0.45;

                  if (modo === "conflitos") {
                    if (cell.conflitos > 0) {
                      fill = "var(--color-destructive)";
                      intensity = 0.25 + (cell.conflitos / maxConflitos) * 0.75;
                      isDark = intensity > 0.4;
                    } else {
                      fill = "var(--color-muted)";
                      intensity = 0.35;
                      isDark = false;
                    }
                  }

                  const primaryLabel =
                    modo === "densidade" ? cell.atendimentos : `${cell.conflitos} div.`;

                  return (
                    <g
                      key={cell.h3}
                      onClick={() => setAtiva(cell)}
                      className="cursor-pointer transition-all duration-200 hover:opacity-90"
                    >
                      <polygon
                        points={hexPoints(x, y)}
                        fill={fill}
                        fillOpacity={intensity}
                        stroke={selected ? "var(--color-foreground)" : "var(--color-border)"}
                        strokeWidth={selected ? 3 : 1.5}
                        className="transition-all duration-150"
                      />
                      <text
                        x={x}
                        y={y - 2}
                        textAnchor="middle"
                        className={cn(
                          "text-[13px] select-none font-bold",
                          isDark
                            ? "fill-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                            : "fill-foreground",
                        )}
                      >
                        {primaryLabel}
                      </text>
                      <text
                        x={x}
                        y={y + 14}
                        textAnchor="middle"
                        className={cn(
                          "text-[9px] select-none font-semibold",
                          isDark
                            ? "fill-white/90 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]"
                            : "fill-muted-foreground",
                        )}
                      >
                        {cell.bairro}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <MapPin className="size-3.5" /> Detalhes da célula
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {ativa.col}x{ativa.row}
                </span>
              </div>
              <CardTitle className="text-xl mt-1">{ativa.bairro}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-lg bg-muted/60 p-2 font-mono text-[11px] text-muted-foreground break-all">
                {ativa.h3}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="text-xs text-muted-foreground">Atendimentos</p>
                  <p className="font-display text-2xl font-semibold mt-1">{ativa.atendimentos}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {((ativa.atendimentos / totalAtendimentos) * 100).toFixed(1)}% da rede
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="text-xs text-muted-foreground">Divergências</p>
                  <p className="font-display text-2xl font-semibold mt-1">{ativa.conflitos}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {totalConflitos > 0
                      ? `${((ativa.conflitos / totalConflitos) * 100).toFixed(1)}% do total`
                      : "0%"}
                  </p>
                </div>
              </div>

              <div className="pt-1">
                {ativa.conflitos > 0 ? (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="gap-1 font-semibold">
                        <AlertTriangle className="size-3" /> {ativa.conflitos} divergências retidas
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Esta região possui registros com conflitos clínicos ou de cadeia de frio que
                      aguardam liberação do RT.
                    </p>
                    <Link
                      to="/auditoria"
                      className="inline-flex items-center text-xs font-semibold text-destructive hover:underline gap-1 pt-1"
                    >
                      Abrir na mesa de auditoria &rarr;
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                    <span>Região 100% conforme, sem divergências no momento.</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Ranking de células</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {[...celulasH3]
                .sort((a, b) =>
                  modo === "conflitos"
                    ? b.conflitos - a.conflitos
                    : b.atendimentos - a.atendimentos,
                )
                .map((c) => {
                  const isSelected = c.h3 === ativa.h3;
                  return (
                    <button
                      key={c.h3}
                      onClick={() => setAtiva(c)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
                        isSelected
                          ? "bg-primary/10 border border-primary/20 text-primary font-semibold"
                          : "hover:bg-accent text-foreground",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span>{c.bairro}</span>
                        {c.conflitos > 0 && (
                          <span className="flex size-2 rounded-full bg-destructive" title={`${c.conflitos} divergências`} />
                        )}
                      </span>
                      <span className="font-mono text-xs font-medium">
                        {modo === "conflitos" ? `${c.conflitos} div.` : `${c.atendimentos} atend.`}
                      </span>
                    </button>
                  );
                })}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
