# 🐾 PetPrev — Plataforma de Saúde Preventiva Veterinária Domiciliar

<p align="center">
  <img src="LogoPetPrev.png" alt="Logo PetPrev" width="180" />
</p>

<p align="center">
  <strong>Cuidado veterinário preventivo contínuo, no conforto do lar, movido a tecnologia e rigor clínico.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/NestJS-10.x-E0234E?logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/PostgreSQL-16%20%2B%20PostGIS-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white" alt="Docker" />
</p>

---

## 📖 Visão Geral

A **PetPrev** é uma plataforma digital de saúde preventiva veterinária por assinatura mensal recorrente (B2C), conectando tutores a médicos-veterinários credenciados para atendimento domiciliar preventivo.

### Principais Diferenciais & Módulos
- ❄️ **Trava Térmica & Cadeia de Frio (2°C a 8°C):** Auditoria contínua da temperatura das caixas térmicas biológicas com bloqueio automático em caso de desvio.
- 📋 **Prontuário Digital Imutável:** Histórico médico com modelo Append-Only, assinatura digital do RT/Veterinário e validação do tutor.
- 💉 **Motor Determinístico de Protocolos Vacinais:** Vacinação e vermifugação automatizadas e parametrizadas por espécie, idade e peso.
- 🗺️ **Roteamento Inteligente & Geo-Alocação:** Agrupamento e otimização de rotas diárias com Uber H3 e cálculo de score ponderado.
- 📴 **Operação Offline-First:** O app do veterinário funciona sem sinal de internet em campo, sincronizando automaticamente ao reconectar.

---

## 🚀 Opção 1: Demonstração Rápida (Sem Instalar Nada)

Se você quer apenas conhecer o visual e navegar pelas telas do sistema já publicadas, acesse os repositórios dos front-ends construídos no Lovable:

- 🖥️ **Painel Web de Gestão / Admin:** [paw-map-dash](https://github.com/Alexlanprog/paw-map-dash.git)
- 📱 **Aplicativo Mobile (Tutor & Veterinário):** [vet-home-care-sync](https://github.com/Alexlanprog/vet-home-care-sync.git)

---

## 💻 Opção 2: Como Rodar o Projeto Localmente

Siga o passo a passo abaixo para rodar toda a stack do PetPrev (Banco de Dados + Backend NestJS + Admin Web + App Mobile) na sua máquina.

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 20 ou superior)
- [Docker & Docker Compose](https://www.docker.com/) (para PostgreSQL, Redis e MinIO)
- [Git](https://git-scm.com/)

---

### Passo 1: Clonar o Repositório

```bash
git clone https://github.com/Alexlanprog/Petprev.git
cd Petprev
```

---

### Passo 2: Subir a Infraestrutura (Banco de Dados, Redis e MinIO)

Inicie os contêineres essenciais em segundo plano:

```bash
docker compose up -d postgres redis minio
```

> **Verificar status dos serviços:**
> ```bash
> docker compose ps
> ```

---

### Passo 3: Iniciar o Backend (NestJS)

Abra um terminal e entre na pasta do backend:

```bash
cd backend
npm install
npm run start:dev
```

O servidor NestJS iniciará em: **`http://localhost:3000/api/v1`**.

---

### Passo 4: Iniciar o Painel Administrativo Web (`frontend-web`)

Abra um segundo terminal e execute:

```bash
cd frontend-web
npm install
npm run dev
```

Acesse o painel no navegador: **`http://localhost:5173`**

**Telas disponíveis no Admin:**
- `/` — Dashboard de operações, métricas e atendimentos do dia.
- `/mapa` — Visualização em mapa das rotas e veterinários em trânsito.
- `/auditoria` — Auditoria clínica de prontuários, divergências e conformidade da trava térmica.

---

### Passo 5: Iniciar o Aplicativo Mobile / Tutor & Vet (`frontend-mobile`)

Abra um terceiro terminal e execute:

```bash
cd frontend-mobile
npm install
npm run dev
```

Acesse a aplicação no navegador: **`http://localhost:5174`**

> 💡 **Dica de Visualização Mobile:**  
> No Google Chrome ou Microsoft Edge, pressione `F12` e clique no ícone de smartphone (**Toggle Device Toolbar** ou `Ctrl + Shift + M`) para simular a tela de um iPhone ou Android.

**Telas disponíveis no App:**
- `/` — Fluxo de atendimento do veterinário em campo.
- `/caixa-termica` — Controle de temperatura da caixa biológica de vacinas.
- `/prontuario` — Registro de exame físico, aplicação de vacinas e assinatura.
- `/tutor` — Hub principal do tutor.
- `/tutor/pets` — Carteira de vacinação e cadastro dos pets.
- `/tutor/agenda` — Solicitação e agendamento de consultas domiciliares.
- `/tutor/assinatura` — Gerenciamento do plano de assinatura e cobrança.

---

## 🌐 URLs e Portas dos Serviços Locais

| Serviço | URL Local | Descrição |
| :--- | :--- | :--- |
| **Admin Web (Dashboard)** | `http://localhost:5173` | Painel de controle do RT e administradores |
| **Mobile App (Tutor & Vet)** | `http://localhost:5174` | Web/PWA responsivo para tutores e veterinários |
| **API Backend (NestJS)** | `http://localhost:3000/api/v1` | API REST e regras de negócio |
| **MinIO Console (Storage)** | `http://localhost:9001` | Painel de controle de arquivos/S3 local |
| **MinIO API (Storage)** | `http://localhost:9000` | Endpoint de upload de imagens e exames |
| **PostgreSQL 16 + PostGIS**| `localhost:5432` | Banco de dados relacional e geoespacial |
| **Redis** | `localhost:6379` | Cache, filas BullMQ e rate-limiting |

---

## 🔑 Contas de Teste (Seeds)

O banco de dados de desenvolvimento possui registros iniciais pré-configurados em `database/seeds/001_initial_seed.sql`:

| Perfil | E-mail / Usuário | Telefone (OTP) | Descrição |
| :--- | :--- | :--- | :--- |
| **Administrador Geral** | `admin@petprev.com.br` | `+5511999990001` | Gestão de clínicas, rotas e financeiro |
| **Responsável Técnico (RT)** | `rt.veterinario@petprev.com.br` | `+5511999990002` | Auditoria de prontuários e aprovação de protocolos |
| **Veterinário de Campo** | *Criado via onboarding* | — | Acesso à caixa térmica, rotas e prontuário |
| **Tutor** | *Criado via app* | — | Gestão de pets, vacinas e assinatura |

---

## 📁 Estrutura do Repositório

```text
Petprev/
├── backend/                  # Monólito Modular NestJS (TypeORM, BullMQ, Auth, GIS)
│   ├── src/                  # Módulos: auth, pets, vaccines, appointments, audit, etc.
│   └── test/                 # Testes unitários e end-to-end (Jest)
├── frontend-web/             # Painel Web Admin (React 19 + TanStack Start + Tailwind CSS v4)
│   └── src/routes/           # Rotas: index, mapa, auditoria
├── frontend-mobile/          # App Mobile Tutor & Vet (React 19 + TanStack Start + Radix UI)
│   └── src/routes/           # Rotas: tutor, agenda, pets, prontuario, caixa-termica
├── database/                 # Estrutura do PostgreSQL
│   ├── migrations/           # DDLs e triggers de imutabilidade de prontuário
│   └── seeds/                # Carga inicial de protocolos clínicos e usuários
├── docker/                   # Arquivos de configuração de containers (Nginx, MinIO, Postgres)
├── scripts/                  # Scripts de automação (smoke-test, backup, deploy)
├── docker-compose.yml        # Orquestração local dos serviços
├── PDD_PRD_PetPrev.md        # Especificação de Produto e Requisitos (PRD v4.3)
└── SDD_PetPrev_Software_Design_Document.md # Documentação de Arquitetura e Engenharia (SDD v3.0)
```

---

## 🧪 Testes e Qualidade

Para rodar os testes automatizados da aplicação:

```bash
# Testes do Backend (Unitários e E2E)
cd backend
npm run test
npm run test:e2e

# Validação de Build dos Front-ends
cd frontend-web && npm run build
cd frontend-mobile && npm run build
```

---

## 📚 Documentação Técnica Adicional

Para entender em profundidade o modelo de negócio, a arquitetura modular e os requisitos regulatórios (CFMV):
- [PDD / PRD PetPrev](PDD_PRD_PetPrev.md) — Documento de Definição de Produto e Regras Clínicas.
- [SDD PetPrev](SDD_PetPrev_Software_Design_Document.md) — Documento de Arquitetura de Software e Engenharia.
- [Roteiro de Execução](Roteiro_Execucao_PetPrev.md) — Fases de rollout, testes operacionais e homologação.

---

<p align="center">
  Desenvolvido com 💚 para transformar a saúde preventiva de cães e gatos.
</p>
