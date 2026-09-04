# Plano de Correção — Fechamento da Migração do Monorepo (Plano 2, Item B2)

**Contexto:** os pacotes `packages/ui` e `packages/utils` já foram criados corretamente — 46 componentes replicados, `package.json` com as dependências certas, `tsconfig.json` de `frontend-web` e `frontend-mobile` já com os path aliases `@petprev/ui`/`@petprev/utils` configurados. **O que falta é a migração em si**: nenhum arquivo da aplicação importa dos pacotes novos ainda, e as pastas antigas continuam existindo — ou seja, hoje há **3 cópias** de cada componente em vez de 1.

Este plano fecha esse gap. Não é preciso recriar nada, só trocar imports e remover o que ficou redundante.

---

## Passo 1 — Migrar os imports de componentes UI

Trocar `@/components/ui/<nome>` por `@petprev/ui` (import nomeado do barrel) em todos os arquivos abaixo, em **ambos os projetos**. O barrel `packages/ui/src/index.ts` já reexporta todos os 46 componentes, então múltiplos imports de `@/components/ui/X` e `@/components/ui/Y` no mesmo arquivo viram um único `import { X, Y } from "@petprev/ui"`.

### `frontend-web/src` (5 arquivos)
- `src/components/DevRoleSwitcher.tsx`
- `src/routes/__root.tsx`
- `src/routes/auditoria.tsx`
- `src/routes/index.tsx`
- `src/routes/mapa.tsx`

### `frontend-mobile/src` (12 arquivos)
- `src/components/DevRoleSwitcher.tsx`
- `src/components/PhotoCapture.tsx`
- `src/components/SignaturePad.tsx`
- `src/components/SyncBar.tsx`
- `src/routes/__root.tsx`
- `src/routes/caixa-termica.tsx`
- `src/routes/index.tsx`
- `src/routes/prontuario.tsx`
- `src/routes/tutor.agenda.tsx`
- `src/routes/tutor.assinatura.tsx`
- `src/routes/tutor.pets.tsx`
- `src/routes/tutor.prontuario.tsx`

**Atenção especial:** `AdminShell.tsx` (web) não importa nenhum componente de `components/ui/`, só `cn` de `@/lib/utils` — não precisa de mudança nesta etapa, só na etapa de utils (Passo 2).

**Critério de aceite:** `grep -rl "@/components/ui/" frontend-web/src frontend-mobile/src --include="*.tsx" --include="*.ts"` retorna **zero resultados** fora das próprias pastas `components/ui/` (que serão removidas no Passo 3).

---

## Passo 2 — Migrar os imports de utils/error-handling

Trocar `@/lib/utils`, `@/lib/error-page`, `@/lib/lovable-error-reporting`, `@/lib/error-capture` por `@petprev/utils` (confirmar no `packages/utils/src/index.ts` se todos os helpers — `cn`, `describeError`, funções de `error-page` e `lovable-error-reporting` — já estão reexportados no barrel; caso algum falte, adicionar antes de migrar os imports).

### `frontend-web/src` (1 arquivo com import direto fora de `components/ui/`)
- `src/components/AdminShell.tsx` (`cn` de `@/lib/utils` → `@petprev/utils`)
- `src/server.ts`, `src/start.ts`, `src/routes/__root.tsx` (error-capture/error-page/lovable-error-reporting → `@petprev/utils`)

### `frontend-mobile/src`
- `src/server.ts`, `src/start.ts`, `src/routes/__root.tsx` (mesma troca)

*(Os arquivos dentro de `components/ui/*.tsx` que hoje importam `@/lib/utils` para o helper `cn` não precisam de migração manual — eles serão apagados no Passo 3 e substituídos pelas versões de `packages/ui`, que já importam de `@petprev/utils` internamente. Confirmar isso antes de apagar.)*

**Critério de aceite:** `grep -rl "@/lib/utils\|@/lib/error-page\|@/lib/lovable-error-reporting\|@/lib/error-capture" frontend-web/src frontend-mobile/src` retorna zero resultados fora de `components/ui/`.

---

## Passo 3 — Remover as pastas duplicadas

Só depois dos Passos 1 e 2 confirmados (nenhum import restante apontando para os caminhos antigos):

```
rm -rf frontend-web/src/components/ui
rm -rf frontend-mobile/src/components/ui
rm frontend-web/src/lib/utils.ts frontend-web/src/lib/error-page.ts frontend-web/src/lib/lovable-error-reporting.ts frontend-web/src/lib/error-capture.ts
rm frontend-mobile/src/lib/utils.ts frontend-mobile/src/lib/error-page.ts frontend-mobile/src/lib/lovable-error-reporting.ts frontend-mobile/src/lib/error-capture.ts
```

**Critério de aceite:** as pastas/arquivos acima não existem mais em nenhum dos dois projetos. `packages/ui` e `packages/utils` passam a ser a única fonte desses componentes/helpers no repositório.

---

## Passo 4 — Verificação fim a fim

Esta etapa é a mais importante, porque até agora **a resolução de módulo dos pacotes nunca foi exercitada de verdade** (nada consumia os pacotes, então um erro de path/alias não apareceria em lugar nenhum).

1. Rodar `npm install` na raiz do monorepo (para o `npm workspaces` linkar `packages/ui`/`packages/utils` corretamente nos `node_modules` de cada app).
2. Rodar `npm run build:all` (script já existe no `package.json` raiz) e confirmar que **ambos** os builds (`build:web` e `build:mobile`) completam sem erro de resolução de módulo ou erro de tipo.
3. Rodar o dev server de cada app (`npm run dev` em `frontend-web` e `frontend-mobile`) e abrir manualmente pelo menos uma tela de cada um dos arquivos migrados no Passo 1, confirmando visualmente que os componentes renderizam normalmente (checar principalmente `sidebar.tsx`, `chart.tsx` e `form.tsx`, que são os componentes mais complexos e com mais dependências internas entre si dentro do próprio `packages/ui`).
4. Confirmar que os hashes de `packages/ui/src/components/*.tsx` continuam batendo com o que era esperado (nenhuma edição acidental durante a migração) — não deveria haver motivo para editar o conteúdo dos componentes nesta etapa, só os pontos de import.

**Critério de aceite final:** build de produção de ambos os frontends passa limpo, telas testadas manualmente renderizam sem erro no console, e não sobra nenhuma referência aos caminhos antigos em todo o repositório (`grep -r "components/ui/" frontend-web/src frontend-mobile/src` e `grep -r "@/lib/utils\|@/lib/error-page\|@/lib/lovable-error-reporting\|@/lib/error-capture" frontend-web/src frontend-mobile/src` retornam vazio).

---

## Resumo priorizado

| Passo | Descrição | Esforço estimado |
|---|---|---|
| 1 | Migrar imports de UI (17 arquivos ao todo) | Baixo-médio (algumas horas, mecânico) |
| 2 | Migrar imports de utils/error-handling (8 arquivos) | Baixo (1-2 horas) |
| 3 | Remover pastas/arquivos duplicados | Trivial (minutos) |
| 4 | Build + smoke test manual dos dois apps | Médio (algumas horas — é o passo que realmente valida se a migração funcionou) |

Não pular o Passo 4: como a estrutura do monorepo nunca foi de fato exercitada em um build real, é o único jeito de confirmar que os path aliases resolvem corretamente em tempo de bundle (TanStack Start/Vite), não só em tempo de type-check do TypeScript.
