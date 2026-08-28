# Roteiro de Execução & Implementação Modular — PetPrev

**Projeto:** PetPrev (Saúde Preventiva Domiciliar)  
**Documentos Base:** `PDD_PRD_PetPrev.md` (v4.3) e `SDD_PetPrev_Software_Design_Document.md` (v3.0)  
**Objetivo:** Guia prático de comandos e prompts para geração de código modular assistida por IA sem alucinação ou perda de contexto.

---

## 1. Regras de Ouro para a Geração de Código com IA

1. **Nunca envie o PRD e o SDD inteiros pedindo o software completo.** Isso gera código incompleto (`// TODO`), esquece validações de segurança e estoura a janela de contexto.
2. **Execute um módulo por vez.** Siga a ordem sequencial de dependências (Infraestrutura ➔ Banco ➔ Auth ➔ Negócio ➔ Frontends).
3. **Exija testes unitários e de integração em cada etapa** para validar as regras críticas (como a imutabilidade do prontuário e a trava térmica).

---

## 2. Visão Geral das Etapas de Construção

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                     PIPELINE DE EXECUÇÃO MODULAR                        │
├─────────────────────────────────────────────────────────────────────────┤
│ ETAPA 1: Infraestrutura Docker Compose & Servidor VPS (MinIO/Postgres)  │
│                                    │                                    │
│                                    ▼                                    │
│ ETAPA 2: Banco de Dados, Extensões PostGIS, Schemas e Triggers CFMV     │
│                                    │                                    │
│                                    ▼                                    │
│ ETAPA 3: Setup do NestJS, Módulo de Autenticação OTP & Matriz RBAC      │
│                                    │                                    │
│                                    ▼                                    │
│ ETAPA 4: Motores Clínicos (Regras Vacinais do RT & Sync Offline-First)  │
│                                    │                                    │
│                                    ▼                                    │
│ ETAPA 5: Módulos de Atendimento, Trava Térmica & Prontuário ECDSA       │
│                                    │                                    │
│                                    ▼                                    │
│ ETAPA 6: Gestão de Assinaturas, Cobrança Recorrente & Payouts PIX       │
│                                    │                                    │
│                                    ▼                                    │
│ ETAPA 7: Filas Redis/BullMQ, Notificações WhatsApp & LiveKit WebRTC     │
│                                    │                                    │
│                                    ▼                                    │
│ ETAPA 8: Painel Web Next.js (Admin/RT) & Apps Mobile React Native       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Prompts e Roteiro de Execução Passo a Passo

### ETAPA 1: Infraestrutura Base & Docker Compose
* **Objetivo:** Subir o ambiente local/VPS com Nginx, PostgreSQL 16 com PostGIS, Redis 7 e MinIO S3.
* **Seções do SDD:** Seção 1 (Visão Geral da Arquitetura).

> **Prompt para a IA:**
> ```text
> Atue como Engenheiro DevOps / SRE. Com base na Seção 1 do SDD da PetPrev, crie o arquivo `docker-compose.yml` de produção para uma VPS Single-Node contendo os serviços:
> 1. NGINX Reverse Proxy com SSL e Terminação HTTP/WSS;
> 2. PostgreSQL 16 com extensão PostGIS;
> 3. Redis 7 para cache e filas BullMQ;
> 4. MinIO S3 local para armazenamento de fotos e evidências;
> 5. Backend NestJS (placeholder de container).
> Adicione também o arquivo `.env.example` com todas as variáveis necessárias e o script de inicialização do PostGIS e criação de buckets do MinIO.
> ```

---

### ETAPA 2: Modelagem de Dados, Migrations e Triggers de Imutabilidade
* **Objetivo:** Criar o schema relacional auditável e a trava de imutabilidade do prontuário (exigência do CFMV).
* **Seções do SDD:** Seção 2 (Modelagem de Dados Completa).

> **Prompt para a IA:**
> ```text
> Atue como DBA e Engenheiro de Backend. Com base na Seção 2 do SDD da PetPrev:
> 1. Gere as migrations SQL para PostgreSQL 16 implementando todas as tabelas: `users`, `user_sessions`, `audit_logs`, `tutors`, `pets`, `veterinarians`, `clinical_protocol_versions`, `subscriptions`, `appointments`, `cold_chain_audits`, `medical_records`, `teleorientation_sessions`, `whatsapp_outbox` e `vet_payouts`.
> 2. Implemente estritamente a trigger function `prevent_medical_record_tampering()` para a tabela `medical_records`, disparando exceção e gravando em `audit_logs` caso haja qualquer tentativa de UPDATE ou DELETE.
> 3. Crie os índices espaciais GIST e os índices em campos H3.
> ```

---

### ETAPA 3: Backend NestJS Core — Auth OTP, Sessões e RBAC
* **Objetivo:** Criar o fluxo de autenticação passwordless via OTP, rotação de refresh tokens e controle de permissões por roles.
* **Seções do SDD:** Seções 2 (users, user_sessions), 4 (Lifecycle OTP) e Seção 8 do PDD (Matriz RBAC).

> **Prompt para a IA:**
> ```text
> Atue como Desenvolvedor Backend Sênior em NestJS/TypeScript.
> Implemente o módulo de autenticação (`AuthModule`) da PetPrev conforme a Seção 4 do SDD e a Seção 8 do PDD:
> 1. Endpoint `POST /api/v1/auth/otp/request`: gera código de 6 dígitos, grava no Redis (TTL 180s, cooldown 60s, max 3 tentativas) e simula o disparo de mensagem;
> 2. Endpoint `POST /api/v1/auth/otp/verify`: valida o código e retorna JWT de acesso (15 min) + Refresh Token rotativo (7 dias) gravado na tabela `user_sessions`;
> 3. Endpoint `POST /api/v1/auth/refresh`: rotaciona o Refresh Token com revogação da sessão anterior;
> 4. Decorator `@Roles(...)` e `RBACGuard` protegendo rotas com base no enum `user_role` da Seção 8 do PDD.
> ```

---

### ETAPA 4: Motores Clínicos — Regras Vacinais do RT e Sync Offline-First
* **Objetivo:** Implementar o motor determinístico de vacinas aprovado pelo RT e a resolução de conflitos offline sem sobrescrita.
* **Seções do SDD:** Seção 3.1 e 3.2.

> **Prompt para a IA:**
> ```text
> Atue como Engenheiro de Software Sênior.
> Com base na Seção 3 do SDD da PetPrev, crie o módulo clínico (`ClinicalModule`):
> 1. `VaccineProtocolEngine`: serviço determinístico que avalia espécies (CANINE / FELINE), semanas de idade e regras dinâmicas em JSON da tabela `clinical_protocol_versions` aprovadas pelo RT;
> 2. `OfflineSyncResolverService`: serviço de sincronização offline-first com estratégia 'Versioned Append-Only com flag de conflito', garantindo que nenhum registro prévio seja sobrescrito no servidor e versionando novos envios para auditoria do RT.
> Forneça testes unitários em Jest para ambos os serviços.
> ```

---

### ETAPA 5: Módulos de Atendimento, Trava Térmica e Prontuário com Assinatura ECDSA
* **Objetivo:** Implementar o fluxo de visitas, auditoria de cadeia de frio (2°C a 8°C) e assinatura digital assimétrica no prontuário.
* **Seções do SDD:** Seções 2 (appointments, cold_chain_audits, medical_records) e 8 (Matriz de Rastreabilidade).

> **Prompt para a IA:**
> ```text
> Atue como Desenvolvedor Backend NestJS.
> Implemente os módulos de Atendimento (`AppointmentsModule`) e Prontuário (`MedicalRecordsModule`):
> 1. Validação de Trava Térmica: Endpoint para upload de foto do termômetro da caixa térmica no MinIO, bloqueando a aplicação de vacinas se a temperatura estiver fora do intervalo de 2.0°C a 8.0°C;
> 2. Prontuário Clínico: Endpoint para gravação de prontuário exigindo:
>    - Hash SHA-256 do payload clínico;
>    - Assinatura digital ECDSA do veterinário validada contra a chave pública salva em `veterinarians(public_key_pem)`;
>    - Metadados de consentimento e imagem de assinatura na tela coletada do tutor.
> ```

---

### ETAPA 6: Gestão de Assinaturas, Gateway de Pagamento e Repasses PIX
* **Objetivo:** Implementar a recorrência do plano de R$ 59,90/mês, gestão de inadimplência e cálculo de repasses por quilometragem e visita.
* **Seções do PDD / SDD:** PDD Seções 5 e 7; SDD Seções 2 (subscriptions, vet_payouts) e 8.

> **Prompt para a IA:**
> ```text
> Atue como Engenheiro de Software especializado em Fintech e Billing.
> Implemente o módulo de Assinaturas e Financeiro (`BillingModule`):
> 1. Integração de Webhooks para cobrança de assinaturas recorrentes (R$ 59,90/mês ou R$ 99,90/mês família);
> 2. Máquina de estados da assinatura: ACTIVE, PENDING_PAYMENT, SUSPENDED_OVERDUE, CANCELED;
> 3. Motor de Payout para Veterinários: Cálculo automático de repasse (R$ 65,00 por consulta aprovada pelo RT + R$ 1,50/km auditado via PostGIS) e inserção na tabela `vet_payouts` com status SCHEDULED.
> ```

---

### ETAPA 7: Filas Assíncronas, Mensageria WhatsApp e Teleorientação WebRTC
* **Objetivo:** Configurar as filas BullMQ com Redis, envio de notificações e geração de salas LiveKit para vídeo.
* **Seções do SDD:** Seções 1, 2 (whatsapp_outbox, teleorientation_sessions) e 5 (LiveKit).

> **Prompt para a IA:**
> ```text
> Atue como Desenvolvedor Backend NestJS.
> Implemente a camada de mensageria e comunicação em tempo real:
> 1. `WhatsAppQueueConsumer` com BullMQ: processa mensagens pendentes da tabela `whatsapp_outbox` e dispara via Evolution API com política de retentativas;
> 2. `TeleorientationService`: cria salas no LiveKit WebRTC com duração máxima de 20 minutos, gerando tokens JWT restritos a 1 tutor e 1 vet, com a flag de gravação desabilitada (`is_recording_enabled: false`) conforme o SDD.
> ```

---

### ETAPA 8: Frontends (Painel Web Next.js e Apps Mobile React Native)
* **Objetivo:** Desenvolver as interfaces de usuário consumindo as APIs dos módulos anteriores.
* **Seções do PDD:** Seção 4 (Wireframes e Arquitetura de Informação).

> **Prompt para a IA (Painel Admin/RT):**
> ```text
> Atue como Desenvolvedor Frontend Sênior em Next.js 14 (App Router) e Tailwind CSS.
> Crie o painel administrativo da PetPrev contendo:
> 1. Dashboard de KPIs (Assinaturas ativas, MRR, atendimentos do dia);
> 2. Tela de Auditoria do RT: listagem de prontuários com flag `has_conflict`, validação de travas térmicas e aprovação de versões de protocolos clínicos;
> 3. Visualização em Mapa dos atendimentos agrupados por índices H3.
> ```

> **Prompt para a IA (App Mobile Tutor/Vet):**
> ```text
> Atue como Desenvolvedor Mobile Sênior em React Native com TypeScript e WatermelonDB/SQLite (Offline-First).
> Crie o fluxo de atendimento domiciliar no App do Veterinário:
> 1. Tela de verificação de temperatura da caixa térmica (com captura de foto);
> 2. Formulário de prontuário clínico SOAP com coleta de assinatura na tela pelo tutor;
> 3. Rotina de enfileiramento local para sincronização em segundo plano quando a conexão de rede for restabelecida.
> ```

---

## 4. Checklist de Validação Final

- [ ] Containers subindo sem erros via `docker-compose up -d`.
- [ ] Trigger do PostgreSQL bloqueando qualquer tentativa de `UPDATE` ou `DELETE` em `medical_records`.
- [ ] Validador de temperatura impedindo avanço de vacinas se termômetro marcar $< 2^\circ	ext{C}$ ou $> 8^\circ	ext{C}$.
- [ ] Assinatura ECDSA validando integridade do hash do prontuário.
- [ ] Sincronização offline gerando nova versão com `has_conflict = true` em vez de sobrescrever dados.
- [ ] Script `scripts/backup-offsite.sh` testado e validando dumps do Postgres e MinIO.
