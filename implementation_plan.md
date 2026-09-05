# Telas de Autenticação: frontend-web (Email+Senha) + frontend-mobile (Persona → Telefone/OTP) + Roteamento por JWT Role

## Contexto

Hoje nenhum dos dois frontends tem tela de login — o usuário cai direto no dashboard/home. O backend já possui o módulo de auth OTP completo (`POST /auth/otp/request` → `POST /auth/otp/verify` → JWT com `role` no payload) e a `UserEntity` já tem campos `email`, `password_hash` e `phone_number`. Porém, o fluxo de email+senha **não existe no backend** (só OTP por telefone).

A proposta do usuário é:

| App | Mecanismo de Auth | Fluxo Visual |
|---|---|---|
| **frontend-web** (Admin/RT) | Email + Senha (e opcionalmente OTP) | Tela de login única |
| **frontend-mobile** (Vet + Tutor) | Telefone + OTP (mesmo mecanismo pra ambos) | Tela de escolha de persona (2 botões visuais) → formulário de telefone/OTP único |

Após login, o **roteamento vem do `role` no JWT**, não do botão visual que a pessoa apertou.

---

## User Review Required

> [!IMPORTANT]
> **Decisão: Login por email+senha no backend**
> O backend atualmente só implementa OTP por telefone. Para o `frontend-web` usar email+senha, precisamos adicionar um endpoint `POST /auth/login` com validação de email + bcrypt no backend. Isso é uma mudança estrutural no `AuthService` e `AuthController`. Confirma que quer que eu implemente isso?

> [!IMPORTANT]
> **Decisão: Persistência de sessão no frontend**
> Atualmente ambos os API clients salvam o `access_token` em `localStorage`. Para o fluxo funcional de refresh token rotation, preciso também salvar o `refresh_token` e implementar interceptors de retry automático no `apiRequest` quando receber 401. Posso implementar isso agora ou deixar pra uma segunda iteração?

> [!WARNING]
> **Cadastro de Admin/RT via interface**
> A tela de login web pressupõe que os usuários Admin/RT já existem no banco com `email`, `password_hash` e `role` corretos. Hoje não existe nenhuma tela de cadastro de admins — eles seriam criados via seed/CLI/SQL direto. Isso está ok pra MVP?

---

## Open Questions

1. **OTP também no frontend-web?** Você mencionou "ou até OTP também, se quiserem manter consistência". Devo implementar um toggle/tab na tela do admin pra alternar entre Email+Senha e Telefone+OTP, ou só email+senha por agora?

2. **Redirect pós-login no mobile:** Hoje o `frontend-mobile` mistura views do Vet (`/`, `/caixa-termica`, `/prontuario`) e do Tutor (`/tutor/*`) no mesmo app. Após o login, o roteamento por role seria:
   - `TUTOR` → redirect pra `/tutor`
   - `VET_FIELD` → redirect pra `/` (home do vet)
   - Qualquer outro role (Admin, RT, etc.) → mensagem de "Use o painel web"
   
   Esse mapeamento está correto?

3. **Logo/branding:** Tenho o [`LogoPetPrev.png`](file:///c:/Users/alexl/OneDrive/Documentos/Petprev/LogoPetPrev.png) na raiz do projeto. Uso ele nas telas de login ou prefere que eu gere novos assets?

---

## Proposed Changes

### Backend — Novo Endpoint de Login Email+Senha

#### [NEW] `login.dto.ts` — `backend/src/modules/auth/dto/login.dto.ts`
- DTO com `email` (IsEmail) e `password` (IsString, MinLength 8)

#### [MODIFY] [`auth.service.ts`](file:///c:/Users/alexl/OneDrive/Documentos/Petprev/backend/src/modules/auth/auth.service.ts)
- Adicionar método `loginWithEmailPassword(dto, ip_address)`:
  - Busca user por email
  - Valida password com `bcrypt.compare()`
  - Verifica `is_active`
  - Verifica se role é um dos permitidos para web (`ADMIN_GERAL`, `OPERADOR_ROTAS`, `VET_RESPONSAVEL_TECNICO`, `SUPORTE`)
  - Reutiliza `createSessionAndTokens()` existente
- Adicionar `bcrypt` como dependência (`npm install bcryptjs @types/bcryptjs`)

#### [MODIFY] [`auth.controller.ts`](file:///c:/Users/alexl/OneDrive/Documentos/Petprev/backend/src/modules/auth/auth.controller.ts)
- Novo endpoint `POST /auth/login` que chama `loginWithEmailPassword()`

---

### frontend-web — Tela de Login Admin (Email + Senha)

#### [NEW] `login.tsx` — `frontend-web/src/routes/login.tsx`
- Tela fullscreen premium com:
  - Logo PetPrev + título "Painel Administrativo"
  - Formulário de email + senha com validação client-side
  - Botão "Entrar" com loading state
  - Feedback de erro inline (credenciais inválidas, conta inativa)
  - Design glassmorphism dark com gradiente teal → indigo (consistente com o design system existente)
- Ao sucesso → salva tokens → redirect pra `/`

#### [MODIFY] [`api-client.ts`](file:///c:/Users/alexl/OneDrive/Documentos/Petprev/frontend-web/src/lib/api-client.ts)
- Adicionar `adminApi.login(email, password)` e `adminApi.logout()`
- Salvar `access_token` + `refresh_token` no localStorage

#### [NEW] `use-auth.ts` — `frontend-web/src/hooks/use-auth.ts`
- Hook com estado de autenticação: `isAuthenticated`, `user`, `login()`, `logout()`
- Decodifica JWT para extrair `role` e `userId`

#### [MODIFY] [`__root.tsx`](file:///c:/Users/alexl/OneDrive/Documentos/Petprev/frontend-web/src/routes/__root.tsx)
- Adicionar guard de autenticação: se não autenticado, redirecionar para `/login`

#### [MODIFY] [`index.tsx`](file:///c:/Users/alexl/OneDrive/Documentos/Petprev/frontend-web/src/routes/index.tsx)
- A rota `/` (Dashboard) fica protegida pelo guard do root — nenhuma mudança funcional direta

---

### frontend-mobile — Tela de Persona + OTP + Roteamento por Role

#### [NEW] `login.tsx` — `frontend-mobile/src/routes/login.tsx`
- **Step 1 — Persona Selector:** Tela com 2 cards visuais grandes:
  - 🩺 "Sou Veterinário" (ícone + cor accent)
  - 🐾 "Sou Tutor" (ícone + cor primary)
  - Nota: a escolha é apenas visual/UX, não determina role nenhuma
- **Step 2 — Telefone:** Campo de telefone com máscara `(XX) XXXXX-XXXX`, botão "Enviar código"
  - Chama `POST /auth/otp/request`
- **Step 3 — OTP:** 6 inputs de dígito individual com auto-focus, timer de cooldown visível, botão "Verificar"
  - Chama `POST /auth/otp/verify`
  - Ao sucesso → salva tokens → **roteia baseado no `role` do JWT**:
    - `TUTOR` → `/tutor`
    - `VET_FIELD` → `/` (home do vet)
    - Qualquer outro → tela de erro "Use o painel web"
- Design mobile-first: cards com animação de slide, teclado numérico nativo, feedback com sonner/toast

#### [NEW] `use-auth.ts` — `frontend-mobile/src/hooks/use-auth.ts`
- Hook similar ao web: `isAuthenticated`, `user`, `logout()`
- Decodifica JWT para extrair `role`

#### [MODIFY] [`api-client.ts`](file:///c:/Users/alexl/OneDrive/Documentos/Petprev/frontend-mobile/src/lib/api-client.ts)
- Já tem `requestOtp` e `verifyOtp` — sem mudanças funcionais (apenas garantir que `refresh_token` é salvo)
- Adicionar `mobileApi.logout()`

#### [MODIFY] [`__root.tsx`](file:///c:/Users/alexl/OneDrive/Documentos/Petprev/frontend-mobile/src/routes/__root.tsx)
- Adicionar guard: se não autenticado, redirecionar para `/login`

#### [MODIFY] [`index.tsx`](file:///c:/Users/alexl/OneDrive/Documentos/Petprev/frontend-mobile/src/routes/index.tsx)
- A rota `/` (Home do Vet) fica protegida — ao carregar, valida que role é `VET_FIELD`

---

## Sumário de Arquivos

| Camada | Arquivo | Ação |
|---|---|---|
| Backend | `dto/login.dto.ts` | NEW |
| Backend | `auth.service.ts` | MODIFY |
| Backend | `auth.controller.ts` | MODIFY |
| Backend | `package.json` | MODIFY (add bcryptjs) |
| frontend-web | `routes/login.tsx` | NEW |
| frontend-web | `hooks/use-auth.ts` | NEW |
| frontend-web | `lib/api-client.ts` | MODIFY |
| frontend-web | `routes/__root.tsx` | MODIFY |
| frontend-mobile | `routes/login.tsx` | NEW |
| frontend-mobile | `hooks/use-auth.ts` | NEW |
| frontend-mobile | `lib/api-client.ts` | MODIFY |
| frontend-mobile | `routes/__root.tsx` | MODIFY |

---

## Verification Plan

### Automated Tests
- `npm test` no backend para rodar os testes existentes do `auth.service.spec.ts` + novos testes do `loginWithEmailPassword`
- `npm run build` em ambos os frontends para verificar que compilam sem erros

### Manual Verification
- Abrir `frontend-web` → deve redirecionar para `/login` → login com email+senha → ver dashboard
- Abrir `frontend-mobile` → deve redirecionar para `/login` → escolher persona → digitar telefone → inserir OTP → roteamento correto baseado no role
- Tentar acessar rota protegida sem token → deve redirecionar para login
- Testar logout → voltar para tela de login
