import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, Check, Snowflake, ThermometerSun, X } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/AdminShell";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Switch,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@petprev/ui";
import { prontuarios as seedProntuarios, protocolos, type Prontuario } from "@/lib/petprev-data";
import { adminApi } from "@/lib/api-client";
import { useEffect } from "react";

export const Route = createFileRoute("/auditoria")({
  component: Auditoria,
  head: () => ({
    meta: [
      { title: "Auditoria do RT · PetPrev Admin" },
      {
        name: "description",
        content:
          "Audite prontuários com conflito, valide travas térmicas da cadeia de frio e aprove versões de protocolos clínicos.",
      },
      { property: "og:title", content: "Auditoria do RT · PetPrev Admin" },
      {
        property: "og:description",
        content: "Prontuários em conflito, travas térmicas e aprovação de protocolos clínicos.",
      },
    ],
  }),
});

const LIMITE_MIN = 2;
const LIMITE_MAX = 8;

function travaBadge(p: Prontuario) {
  if (p.travaTermica === "violada") {
    return (
      <Badge variant="destructive" className="gap-1 shadow-sm">
        <AlertTriangle className="size-3" /> Trava violada
      </Badge>
    );
  }
  if (p.travaTermica === "alerta") {
    return (
      <Badge variant="warning" className="gap-1">
        <ThermometerSun className="size-3" /> Fora da faixa
      </Badge>
    );
  }
  return (
    <Badge variant="success" className="gap-1">
      <Check className="size-3" /> Conforme
    </Badge>
  );
}

function Auditoria() {
  const [prontuariosList, setProntuariosList] = useState<Prontuario[]>(seedProntuarios);
  const [somenteConflito, setSomenteConflito] = useState(true);
  const [decisoes, setDecisoes] = useState<Record<string, "aprovado" | "reprovado">>({});

  useEffect(() => {
    let isMounted = true;
    adminApi
      .getMedicalRecords()
      .then((records: any[]) => {
        if (isMounted && Array.isArray(records) && records.length > 0) {
          const mapped: Prontuario[] = records.map((r: any) => ({
            id: r.id ? `PRT-${r.id.slice(0, 5).toUpperCase()}` : "PRT-DEV",
            pet: r.pet?.name || "Paciente PetPrev",
            tutor: r.pet?.tutor?.full_name || "Tutor Cadastrado",
            clinica: "Atendimento Domiciliar",
            data: r.created_at || new Date().toISOString(),
            rt: r.veterinarian?.full_name || "Dr(a). Veterinário(a)",
            has_conflict: Boolean(r.has_conflict),
            motivo: r.has_conflict
              ? r.clinical_notes || "Divergência detectada pelo sistema"
              : null,
            travaTermica: "ok",
            tempMin: 3.2,
            tempMax: 6.9,
            status: "pendente",
          }));
          setProntuariosList((prev) => [...mapped, ...prev]);
        }
      })
      .catch(() => {
        // Fallback gracioso para os dados mock já carregados
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const lista = useMemo(
    () => (somenteConflito ? prontuariosList.filter((p) => p.has_conflict) : prontuariosList),
    [somenteConflito, prontuariosList],
  );

  const decidir = (id: string, decisao: "aprovado" | "reprovado") => {
    setDecisoes((d) => ({ ...d, [id]: decisao }));
    toast.success(
      decisao === "aprovado" ? `${id} aprovado pelo RT` : `${id} devolvido para correção`,
    );
  };

  return (
    <AdminShell
      title="Auditoria do RT"
      subtitle="Conferência técnica de prontuários, cadeia de frio e versionamento clínico"
    >
      <Tabs defaultValue="prontuarios">
        <TabsList>
          <TabsTrigger value="prontuarios">Prontuários</TabsTrigger>
          <TabsTrigger value="travas">Travas térmicas</TabsTrigger>
          <TabsTrigger value="protocolos">Protocolos clínicos</TabsTrigger>
        </TabsList>

        <TabsContent value="prontuarios" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Prontuários ({lista.length})</CardTitle>
              <div className="flex items-center gap-2.5">
                <Switch
                  id="conflito"
                  checked={somenteConflito}
                  onCheckedChange={setSomenteConflito}
                />
                <Label htmlFor="conflito" className="cursor-pointer text-sm font-medium text-foreground flex items-center gap-1.5 select-none">
                  <span>Apenas com divergências</span>
                  <Badge variant="destructive" className="h-5 px-1.5 text-[10px] font-bold">
                    {prontuariosList.filter((p) => p.has_conflict).length}
                  </Badge>
                </Label>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prontuário</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>RT</TableHead>
                    <TableHead>Conflito</TableHead>
                    <TableHead>Cadeia de frio</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lista.map((p) => {
                    const decisao = decisoes[p.id] ?? p.status;
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <span className="inline-flex items-center font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-foreground border border-border/80 tracking-tight">
                            {p.id}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{p.pet}</span>
                          <span className="block text-xs text-muted-foreground">{p.tutor}</span>
                        </TableCell>
                        <TableCell className="text-sm">{p.clinica}</TableCell>
                        <TableCell className="text-sm">{p.rt}</TableCell>
                        <TableCell className="max-w-72">
                          {p.has_conflict ? (
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
                              <span className="text-xs text-muted-foreground">{p.motivo}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Sem divergências</span>
                          )}
                        </TableCell>
                        <TableCell>{travaBadge(p)}</TableCell>
                        <TableCell className="text-right">
                          {decisao === "pendente" ? (
                            <div className="flex justify-end gap-1.5">
                              <Button size="sm" className="h-8 gap-1" onClick={() => decidir(p.id, "aprovado")}>
                                <Check className="size-3.5" /> Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                                onClick={() => decidir(p.id, "reprovado")}
                              >
                                <X className="size-3.5" /> Devolver
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              {decisao === "aprovado" ? (
                                <Badge variant="success" className="gap-1">
                                  <Check className="size-3" /> Aprovado
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="gap-1">
                                  <X className="size-3" /> Devolvido
                                </Badge>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                  setDecisoes((d) => {
                                    const next = { ...d };
                                    delete next[p.id];
                                    return next;
                                  });
                                  toast.info(`Auditoria de ${p.id} reaberta`);
                                }}
                              >
                                Reabrir
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="travas" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Validação de travas térmicas · faixa permitida {LIMITE_MIN},0 °C a {LIMITE_MAX},0 °C
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {prontuariosList.map((p) => {
                const violada = p.tempMin < LIMITE_MIN || p.tempMax > LIMITE_MAX;
                return (
                  <div key={p.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-xs text-muted-foreground">{p.id}</p>
                      {travaBadge(p)}
                    </div>
                    <p className="mt-1 text-sm font-medium">{p.clinica}</p>
                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1.5">
                        <Snowflake className="size-4 text-chart-3" /> mín {p.tempMin.toFixed(1)} °C
                      </span>
                      <span className="flex items-center gap-1.5">
                        <ThermometerSun className="size-4 text-chart-5" /> máx{" "}
                        {p.tempMax.toFixed(1)} °C
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={violada ? "h-full bg-destructive" : "h-full bg-chart-2"}
                        style={{
                          width: `${Math.min(100, (p.tempMax / 12) * 100)}%`,
                        }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {violada
                        ? "Lote bloqueado automaticamente para aplicação."
                        : "Lote liberado para aplicação clínica."}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="protocolos" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {protocolos.map((proto) => {
              const decisao = decisoes[proto.id] ?? proto.status;
              return (
                <Card key={proto.id}>
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{proto.nome}</CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {proto.id} · {proto.versao} · {proto.escopo}
                      </p>
                    </div>
                    <Badge
                      variant={
                        decisao === "pendente"
                          ? "warning"
                          : decisao === "aprovado"
                            ? "success"
                            : "destructive"
                      }
                    >
                      {decisao === "pendente"
                        ? "Aguardando RT"
                        : decisao === "aprovado"
                          ? "Vigente"
                          : "Reprovado"}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                      {proto.mudancas.map((m) => (
                        <li key={m} className="flex gap-2">
                          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                          {m}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Submetido por {proto.autor} em{" "}
                      {new Date(proto.atualizado).toLocaleDateString("pt-BR")}
                    </p>
                    {decisao === "pendente" ? (
                      <div className="mt-4 flex gap-2">
                        <Button size="sm" onClick={() => decidir(proto.id, "aprovado")}>
                          Aprovar versão
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => decidir(proto.id, "reprovado")}
                        >
                          Solicitar ajustes
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                        <span className="text-xs text-muted-foreground">Parecer registrado</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setDecisoes((d) => {
                              const next = { ...d };
                              delete next[proto.id];
                              return next;
                            });
                            toast.info(`Parecer de ${proto.id} reaberto`);
                          }}
                        >
                          Alterar parecer
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </AdminShell>
  );
}
