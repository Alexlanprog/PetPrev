# SDD — System Design Document & Arquitetura de Software: PetPrev

**Produto:** PetPrev — Saúde Preventiva Domiciliar  
**Versão:** 3.1 (Especificação Técnica — MVP Funcional em Desenvolvimento)  
**Documento Relacionado:** [`PDD_PRD_PetPrev.md`](file:///c:/Users/alexl/OneDrive/Documentos/Petprev/PDD_PRD_PetPrev.md)  
**Status:** **MVP FUNCIONAL EM DESENVOLVIMENTO — Fase 1**  
**Autor:** Antigravity AI & Engenharia PetPrev

---

# 1. Visão Geral da Arquitetura & Roadmap de Infraestrutura

O sistema **PetPrev** é um **Monólito Modular orientado a Eventos em NestJS**, containerizado via **Docker Compose em Servidor VPS Único (On-Premise)** para a Fase 1 (MVP/Lançamento), com roteiro claro de evolução de disponibilidade e desastres.

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENTES (FRONTEND LAYER)                                      │
│  ┌───────────────────────────┐   ┌───────────────────────────┐   ┌───────────────────────────┐   │
│  │   App Web / PWA Tutor     │   │   App Web / PWA Vet       │   │   Painel Web Admin (RT)   │   │
│  │ (React 19 / TanStack PWA) │   │ (React 19 / Dexie Sync)   │   │ (React 19 / TanStack)     │   │
│  └─────────────┬─────────────┘   └─────────────┬─────────────┘   └─────────────┬─────────────┘   │
└────────────────┼───────────────────────────────┼───────────────────────────────┼─────────────────┘
                 │ (HTTPS / TLS 1.3)             │ (HTTPS / Sync Offline)        │ (HTTPS / REST)
                 ▼                               ▼                               ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             SERVIDOR VPS ÚNICO (DOCKER COMPOSE HOST)                             │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ NGINX Reverse Proxy + Let's Encrypt SSL (SSL Termination, Rate Limiting & WebRTC Proxy)    │  │
│  └─────────────────────────────────────────────┬──────────────────────────────────────────────┘  │
│                                                ▼                                                 │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ BACKEND CONTAINER (NESTJS / TYPESCRIPT MONOLITH)                                           │  │
│  │ - Auth OTP & Token Rotation               - Logistics (Uber H3 Index / Triagem Manual MVP) │  │
│  │ - Protocol Version Engine & Cold Chain    - Asaas Billing & Batch PIX Payout Engine        │  │
│  └───────────────────┬─────────────────────────┬─────────────────────────┬────────────────────┘  │
│                      │                         │                         │                       │
│                      ▼                         ▼                         ▼                       │
│  ┌──────────────────────────────┐ ┌───────────────────────────┐ ┌─────────────────────────────┐  │
│  │ DATABASE CONTAINER           │ │ QUEUE & CACHE CONTAINER   │ │ LOCAL STORAGE (MINIO S3)    │  │
│  │ PostgreSQL 16 + PostGIS      │ │ Redis 7 + BullMQ          │ │ MinIO S3-Compatible Storage │  │
│  │ - Trigger Imutável (CFMV)    │ │ - WhatsApp Evolution API  │ │ - Fotos de Termômetros      │  │
│  │ - Assinatura ECDSA + Audit   │ │ - LiveKit (Adiado v2/Ext) │ │ - Evidências Aceite Tutor   │  │
│  └──────────────────────────────┘ └───────────────────────────┘ └─────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## 1.1 Estrutura do Monorepo Frontend & Pacotes Compartilhados

Para erradicar a duplicação de componentes shadcn/ui e utilitários de infraestrutura entre o painel administrativo (`frontend-web`) e o aplicativo mobile/tutor/vet (`frontend-mobile`), o projeto adota uma arquitetura de monorepo via **npm workspaces**:

- **`packages/ui` (`@petprev/ui`)**: Centraliza os 46 componentes base de interface (shadcn/ui, formulários, botões, modais, etc.), garantindo consistência visual e manutenibilidade única.
- **`packages/utils` (`@petprev/utils`)**: Centraliza helpers de estilização (`cn()`), tratamento e captura de erros SSR (`describeError`) e funções utilitárias compartilhadas.
- **`frontend-web`**: Aplicação voltada à gestão, RT e operação, consumindo `@petprev/ui` e `@petprev/utils`.
- **`frontend-mobile`**: PWA responsivo com offline-first (Dexie/IndexedDB e Service Worker), consumindo os mesmos componentes e utilitários centralizados.

## 1.2 Roadmap de Evolução de Disponibilidade (RPO & RTO)

| Fase do Projeto | Arquitetura de Infraestrutura | Target RTO (Tempo de Recuperação) | Target RPO (Perda Max. de Dados) |
| :--- | :--- | :---: | :---: |
| **Fase 1 (MVP / Lançamento)** | **VPS Linux Single-Node (Docker Compose)** | **RTO < 2 Horas** | **RPO < 24 Horas (Backup Diário Offsite)** |
| **Fase 2 (Crescimento)** | **VPS com Replica Read-Only + Snapshots** | **RTO < 30 Minutos** | **RPO < 4 Horas (Snapshots Periódicos)** |
| **Fase 3 (Escala HA)** | **Multi-AZ Kubernetes / AWS ECS Cluster** | **RTO < 5 Minutos** | **RPO < 1 Hora (Streaming Replication)** |

---

# 2. Modelagem de Dados Completa, Auditabilidade & Imutabilidade (PostgreSQL)

O schema do banco de dados relacional cobre 100% dos módulos do PDD, adicionando **Assinatura Assimétrica do Vet**, **Evidência de Aceite do Tutor**, **Tabela de Audit Logs** e **Protocolos Clínicos Versionados**.

```sql
-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. ROLES UNIFICADAS DO RBAC
CREATE TYPE user_role AS ENUM ('ADMIN_GERAL', 'OPERADOR_ROTAS', 'VET_RESPONSAVEL_TECNICO', 'SUPORTE', 'TUTOR', 'VET_FIELD');

-- 3. USUÁRIOS (PASSWORD HASh NULLABLE PARA OTP)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'TUTOR',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABELA DE SESSÕES & REFRESH TOKENS (AUTENTICAÇÃO SEGURA)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL,
    device_info VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABELA DE AUDITORIA UNIFICADA (AUDIT LOGS TRACEÁVEL)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL, -- e.g., 'CREATE_MEDICAL_RECORD', 'ATTEMPT_TAMPERING'
    entity_name VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    device_id VARCHAR(100),
    metadata_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. TUTORES & LOCALIZAÇÃO
CREATE TABLE tutors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    address_street VARCHAR(255) NOT NULL,
    address_number VARCHAR(20) NOT NULL,
    address_neighborhood VARCHAR(100) NOT NULL,
    address_city VARCHAR(100) NOT NULL,
    address_zipcode VARCHAR(10) NOT NULL,
    location GEOMETRY(Point, 4326),
    h3_index_res8 VARCHAR(15),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. PETS
CREATE TYPE pet_species AS ENUM ('CANINE', 'FELINE');

CREATE TABLE pets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutor_id UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    species pet_species NOT NULL,
    breed VARCHAR(100) NOT NULL,
    gender VARCHAR(10) NOT NULL,
    birth_date DATE NOT NULL,
    weight_kg NUMERIC(5,2),
    photo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. VETERINÁRIOS & CHAVE PÚBLICA PARA ECDSA
CREATE TABLE veterinarians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    crmv_number VARCHAR(20) NOT NULL,
    crmv_uf VARCHAR(2) NOT NULL,
    approval_status VARCHAR(20) DEFAULT 'PENDING_APPROVAL',
    approved_by_rt UUID REFERENCES users(id),
    pix_key VARCHAR(100) NOT NULL,
    rating_average NUMERIC(3,2) DEFAULT 5.00,
    public_key_pem TEXT, -- Chave Pública ECDSA/RSA do Veterinário
    base_location GEOMETRY(Point, 4326),
    base_h3_index VARCHAR(15),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. PROTOCOLOS CLÍNICOS VERSIONADOS (APROVADOS PELO RT)
CREATE TABLE clinical_protocol_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version_name VARCHAR(50) NOT NULL, -- e.g., 'PROTOCOLO_PETPREV_2026_V1'
    approved_by_rt UUID NOT NULL REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    rules_json JSONB NOT NULL, -- Regras parametrizadas de vacinas e idades
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. ASSINATURAS E COBRANÇA
CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'PENDING_PAYMENT', 'SUSPENDED_OVERDUE', 'CANCELED');

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutor_id UUID NOT NULL REFERENCES tutors(id),
    plan_type VARCHAR(50) NOT NULL,
    monthly_price NUMERIC(10,2) NOT NULL,
    status subscription_status DEFAULT 'ACTIVE',
    gateway_subscription_id VARCHAR(100),
    current_period_start DATE NOT NULL,
    current_period_end DATE NOT NULL,
    loyalty_end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. ATENDIMENTOS (VISITAS)
CREATE TYPE appointment_status AS ENUM (
    'REQUESTED', 'ROUTE_ASSIGNED', 'EN_ROUTE', 'IN_PROGRESS', 'COMPLETED', 'CANCELED', 'FAILED_ABSENT'
);

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutor_id UUID NOT NULL REFERENCES tutors(id),
    pet_id UUID NOT NULL REFERENCES pets(id),
    veterinarian_id UUID REFERENCES veterinarians(id),
    scheduled_date DATE NOT NULL,
    time_window_start TIME NOT NULL,
    time_window_end TIME NOT NULL,
    status appointment_status DEFAULT 'REQUESTED',
    distance_km_audited NUMERIC(5,2),
    payout_vet_amount NUMERIC(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. AUDITORIA DE TRAVA TÉRMICA
CREATE TABLE cold_chain_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES appointments(id),
    veterinarian_id UUID NOT NULL REFERENCES veterinarians(id),
    temperature_celsius NUMERIC(4,1) NOT NULL,
    proof_photo_url TEXT NOT NULL,
    validation_status VARCHAR(20) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    gps_location GEOMETRY(Point, 4326) NOT NULL
);

-- 13. PRONTUÁRIO ELETRÔNICO LEGALMENTE IMUTÁVEL COM MODELAGEM DUPLA (VET + TUTOR)
CREATE TABLE medical_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES appointments(id),
    pet_id UUID NOT NULL REFERENCES pets(id),
    veterinarian_id UUID NOT NULL REFERENCES veterinarians(id),
    version INT NOT NULL DEFAULT 1,
    has_conflict BOOLEAN DEFAULT FALSE,
    weight_recorded NUMERIC(5,2) NOT NULL,
    temperature_body NUMERIC(4,1) NOT NULL,
    clinical_notes TEXT NOT NULL,
    vaccine_lot_applied VARCHAR(100),
    
    -- Assinatura Assimétrica do Veterinário
    payload_hash_sha256 VARCHAR(64) NOT NULL,
    vet_digital_signature_base64 TEXT NOT NULL,
    vet_signed_at TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Aceite & Evidência do Tutor
    tutor_consent_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    tutor_consent_ip VARCHAR(45) NOT NULL,
    tutor_consent_device_id VARCHAR(100),
    tutor_consent_signature_image_url TEXT, -- Imagem da assinatura coletada na tela do app
    tutor_consent_document_version VARCHAR(50) NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TRIGGER DE IMUTABILIDADE COM LOG DE AUDITORIA
CREATE OR REPLACE FUNCTION prevent_medical_record_tampering()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs(actor_id, action, entity_name, entity_id, ip_address, metadata_json)
    VALUES (NULL, 'ATTEMPTED_RECORD_TAMPERING', 'medical_records', OLD.id, '0.0.0.0', json_build_object('old_data', OLD));
    
    RAISE EXCEPTION 'VIOLAÇÃO LEGAL (CFMV): Prontuários não podem ser alterados ou excluídos após o registro.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_protect_medical_records
BEFORE UPDATE OR DELETE ON medical_records
FOR EACH ROW EXECUTE FUNCTION prevent_medical_record_tampering();

-- 14. TELEORIENTAÇÃO WEBRTC (CONFIGURADO PARA NÃO GRAVAR NO MVP)
CREATE TABLE teleorientation_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutor_id UUID NOT NULL REFERENCES tutors(id),
    veterinarian_id UUID NOT NULL REFERENCES veterinarians(id),
    room_name VARCHAR(100) NOT NULL,
    is_recording_enabled BOOLEAN DEFAULT FALSE, -- FALSO NO MVP (Política de Privacidade)
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE
);

-- 15. WHATSAPP OUTBOX QUEUE
CREATE TABLE whatsapp_outbox (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_to VARCHAR(20) NOT NULL,
    message_text TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    retry_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. RECONCILIAÇÃO FINANCEIRA E PIX BATCH
CREATE TABLE vet_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    veterinarian_id UUID NOT NULL REFERENCES veterinarians(id),
    appointment_id UUID NOT NULL REFERENCES appointments(id),
    amount_consultation NUMERIC(10,2) NOT NULL,
    amount_km NUMERIC(10,2) NOT NULL,
    total_payout NUMERIC(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'SCHEDULED',
    paid_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_tutors_location ON tutors USING GIST(location);
CREATE INDEX idx_tutors_h3 ON tutors(h3_index_res8);
CREATE INDEX idx_appointments_date_status ON appointments(scheduled_date, status);
```

---

# 3. Implementação dos Motores Core Refinados

## 3.1 Engine 1: Motor de Regras Vacinais Parametrizado por Protocolo Aprovado pelo RT

```typescript
// src/modules/clinical/domain/vaccine-engine.ts

export interface ProtocolRule {
  species: 'CANINE' | 'FELINE';
  minAgeWeeks: number;
  maxAgeWeeks: number;
  requiredVaccines: string[];
  doseLabel: string;
  nextDoseWindowDays: { min: number; max: number };
}

export class VaccineProtocolEngine {
  /**
   * Avalia o protocolo baseado na VERSÃO DINÂMICA aprovada pelo Responsável Técnico (RT)
   */
  public static evaluateWithRtProtocol(
    petSpecies: 'CANINE' | 'FELINE',
    ageInWeeks: number,
    protocolRules: ProtocolRule[]
  ) {
    const matchedRule = protocolRules.find(
      rule => rule.species === petSpecies && ageInWeeks >= rule.minAgeWeeks && ageInWeeks <= rule.maxAgeWeeks
    );

    if (!matchedRule) {
      return {
        eligibleVaccines: petSpecies === 'CANINE' ? ['V10_CANINE', 'RABIES'] : ['V4_FELINE', 'RABIES'],
        currentDose: 'ANNUAL_BOOSTER',
        nextDoseWindowDays: { min: 330, max: 365 },
      };
    }

    return {
      eligibleVaccines: matchedRule.requiredVaccines,
      currentDose: matchedRule.doseLabel,
      nextDoseWindowDays: matchedRule.nextDoseWindowDays,
    };
  }
}
```

## 3.2 Engine 2: Resolução de Conflitos Sync Offline-First (Versioned Append-Only)

```typescript
// src/modules/clinical/services/offline-sync-resolver.service.ts

import { Injectable } from '@nestjs/common';

@Injectable()
export class OfflineSyncResolverService {
  /**
   * Trata conflitos de prontuários médicos offline usando Versioned Append-Only (Nunca Sobrescreve)
   */
  public async resolveMedicalRecordConflict(incomingRecord: any, existingRecord: any) {
    if (!existingRecord) {
      return await this.saveRecord({ ...incomingRecord, version: 1, hasConflict: false });
    }

    // Se já existir registro no servidor, cria uma NOVA VERSÃO sinalizando conflito para revisão do RT
    const newVersion = existingRecord.version + 1;
    return await this.saveRecord({
      ...incomingRecord,
      version: newVersion,
      hasConflict: true, // Notifica o Painel do RT para auditoria sem perder nenhum dado
    });
  }

  private async saveRecord(data: any) { /* Gravação no PostgreSQL */ }
}
```

---

# 4. Arquitetura de Autenticação OTP Completa (Lifecycle)

```text
1. SOLICITAÇÃO OTP ──> POST /api/v1/auth/otp/request { phone: "+5511999999999" }
                       - Gera código de 6 dígitos
                       - Envia via WhatsApp Evolution API (ou SMS)
                       - Grava no Redis com TTL de 180 segundos e Cooldown de 60s
                       - Limite máximo: 3 tentativas incorretas por telefone.

2. VERIFICAÇÃO OTP ───> POST /api/v1/auth/otp/verify { phone, code }
                       - Valida no Redis
                       - Retorna Access Token JWT (Expira em 15 minutos)
                       - Retorna Refresh Token Criptografado (Expira em 7 dias, gravado na tabela `user_sessions`).

3. ROTAÇÃO & LOGOUT ──> POST /api/v1/auth/refresh { refreshToken }
                       - Rotaciona o Refresh Token e revoga a sessão anterior na tabela `user_sessions`.
```

---

# 5. Governança e Especificação do LiveKit WebRTC (Teleorientação)

- **Geração de Tokens JWT:** Token gerado pela API NestJS com salas dinâmicas `room_name: "session_id"`.
- **Duração Máxima:** Expira automaticamente em **20 minutos**.
- **Participantes:** Restrito a exatamente 1 Tutor e 1 Veterinário credenciado.
- **Política de Gravação (MVP):** **SESSÕES NÃO GRAVADAS (`recording_enabled: false`)** para conformidade de privacidade e redução de custos.

---

# 6. Observabilidade & Métricas do Prometheus

As métricas são expostas no endpoint `/metrics` do Backend e coletadas pelo container Prometheus:

| Categoria | Nome da Métrica | Tipo | Descrição |
| :--- | :--- | :--- | :--- |
| **Infraestrutura** | `process_cpu_seconds_total` | Counter | Uso de CPU do container NestJS |
| **Infraestrutura** | `nodejs_heap_size_used_bytes` | Gauge | Memória RAM consumida pela aplicação |
| **Aplicação** | `http_request_duration_seconds` | Histogram | Latência das requisições HTTP da API |
| **Aplicação** | `http_requests_errors_total` | Counter | Total de erros HTTP 5xx e 4xx |
| **Aplicação** | `bullmq_queue_size` | Gauge | Quantidade de mensagens pendentes nas filas Redis |
| **Negócio** | `petprev_appointments_completed_total` | Counter | Total de atendimentos preventivos concluídos |
| **Negócio** | `petprev_cold_chain_blocked_total` | Counter | Total de vacinações bloqueadas por falha de temperatura |
| **Negócio** | `petprev_active_subscriptions` | Gauge | Número total de assinaturas ativas na plataforma |

---

# 7. Estratégia Completa de Backup Offsite (PostgreSQL + MinIO Storage)

O script de backup diário realiza a cópia de segurança **tanto do banco de dados quanto dos arquivos de mídia do MinIO local**:

```bash
#!/bin/bash
# scripts/backup-offsite.sh — Backup Diário Completo (PostgreSQL + MinIO Storage)

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/petprev"
ENV_FILE="/opt/petprev/.env"

source $ENV_FILE
mkdir -p $BACKUP_DIR

echo "[1/3] Gerando Dump Criptografado do PostgreSQL..."
docker exec petprev_postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB | gzip > $BACKUP_DIR/db_$TIMESTAMP.sql.gz

echo "[2/3] Sincronizando Arquivos de Mídia do MinIO..."
docker exec petprev_minio mc mirror /data $BACKUP_DIR/minio_data_$TIMESTAMP

echo "[3/3] Enviando Backups Criptografados para Storage Offsite via Rclone..."
rclone copy $BACKUP_DIR/ remote_backup:petprev-backups/$TIMESTAMP/

# Limpeza local de backups com mais de 7 dias
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup Completo (Banco + MinIO) concluído em $TIMESTAMP!"
```

---

# 8. Matriz de Rastreabilidade Requisitos PDD ➔ Componentes SDD (Status Real do MVP)

A tabela abaixo detalha a situação real de implementação de cada requisito funcional no estágio atual do projeto (MVP Fase 1):

| Requisito PDD | Descrição do Requisito | Componente Backend SDD | Tabela PostgreSQL | Status Real | Detalhamento / Observações |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **RF01** | Cadastro e Login OTP de Tutores | AuthModule | `users`, `user_sessions` | 🟡 Parcial | Autenticação OTP e geração de JWT implementadas; envio de SMS/WhatsApp em simulação/log. |
| **RF02** | Cadastro de Múltiplos Pets | TutorsModule | `pets` | ✅ Implementado | CRUD completo vinculado ao tutor autenticado. |
| **RF03** | Assinaturas & Checkout Recorrente | BillingModule | `subscriptions` | ✅ Implementado | Integração de assinaturas e webhooks Asaas autenticados via timingSafeEqual. |
| **RF04** | Agendamento de Atendimento | AppointmentsModule | `appointments` | ✅ Implementado | Ciclo completo de status (Requested, Route Assigned, En Route, In Progress, Completed). |
| **RF05** | Motor Vacinal Clínico | VaccineEngine | `clinical_protocol_versions` | ✅ Implementado | Lógica determinística por espécie/idade com cobertura de testes unitários. |
| **RF06** | Trava Térmica (2°C a 8°C) | ColdChainValidator | `cold_chain_audits` | 🟡 Parcial | Validação de faixa de temperatura e foto de display implementadas; geolocalização com coordenadas fixas. |
| **RF07** | Prontuário Imutável (CFMV) | MedicalRecordModule | `medical_records` (Trigger SQL) | ✅ Implementado | Imutabilidade via trigger de banco e proteção estrita contra IDOR implementada. |
| **RF08** | Assinatura Vet & Aceite Tutor | DigitalSignatureService | `medical_records` (ECDSA + Consent) | ✅ Implementado | Validação criptográfica ECDSA em produção e descarte de URLs fictícias no MinIO. |
| **RF09** | Notificações WhatsApp API | CommunicationsModule | `whatsapp_outbox` | 🔴 Não integrado | Fila BullMQ e consumers criados; aguardando integração e credenciais da Evolution API. |
| **RF10** | Roteamento Hexagonal H3 | LogisticsModule | `tutors(h3_index)`, `appointments` | 🟡 Parcial | Indexação espacial H3 res 8 de tutores ativa; alocação manual por bairro/CEP no MVP; DBSCAN adiado para v2. |
| **RF11** | Credenciamento & Aprovação RT | VetsModule | `veterinarians` | ✅ Implementado | Cadastro com CRMV e aprovação administrativa implementados. |
| **RF12** | Teleorientação por Vídeo | TeleorientationModule | `teleorientation_sessions` | 🔴 Adiado v2 | Infraestrutura LiveKit WebRTC adiada para Fase 2; links externos (WhatsApp/Meet) no MVP. |
| **RF13** | Repasse Financeiro & PIX Batch | BillingModule | `vet_payouts` | ✅ Implementado | Cálculo de split e motor de repasses aos veterinários com testes automatizados. |
| **RF14** | Modo Offline Mobile App | SyncModule (IndexedDB) | Sync Idempotente + Append-Only | ✅ Implementado | Fila offline via Dexie.js (IndexedDB), Service Worker PWA com timeout e retentativa em HTTP 502. |
| **RF15** | Matriz de Permissões RBAC | RBACGuard | `users(role)` | ✅ Implementado | RBACGuard e perfis TUTOR, VET_FIELD, VET_RESPONSAVEL_TECNICO e ADMIN_GERAL ativos. |
| **RF16** | Auditoria e Traceabilidade | AuditModule | `audit_logs` | ✅ Implementado | Gravação de trilha de auditoria para operações sensíveis e alterações de estado. |

---

> **Status Final:** O documento SDD v3.1 reflete com precisão técnica a arquitetura real do **MVP Fase 1**, separando claramente as capacidades operacionais prontas dos itens planejados para fases posteriores.
