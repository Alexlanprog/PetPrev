-- ==============================================================================
-- PETPREV — SCRIPT DE INICIALIZAÇÃO DE TABELAS, TRIGGERS E ÍNDICES (POSTGRESQL 16)
-- Executado no bootstrap do container PostgreSQL (/docker-entrypoint-initdb.d/)
-- ==============================================================================

-- 1. ENUMS DE DOMÍNIO
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM (
            'ADMIN_GERAL',
            'OPERADOR_ROTAS',
            'VET_RESPONSAVEL_TECNICO',
            'SUPORTE',
            'TUTOR',
            'VET_FIELD'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pet_species') THEN
        CREATE TYPE pet_species AS ENUM ('CANINE', 'FELINE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
        CREATE TYPE subscription_status AS ENUM (
            'ACTIVE',
            'PENDING_PAYMENT',
            'SUSPENDED_OVERDUE',
            'CANCELED'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
        CREATE TYPE appointment_status AS ENUM (
            'REQUESTED',
            'ROUTE_ASSIGNED',
            'EN_ROUTE',
            'IN_PROGRESS',
            'COMPLETED',
            'CANCELED',
            'FAILED_ABSENT'
        );
    END IF;
END $$;

-- 2. TABELA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS users (
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

-- 3. TABELA DE SESSÕES & REFRESH TOKENS ROTATIVOS
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL,
    device_info VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABELA DE LOGS DE AUDITORIA UNIFICADA
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    device_id VARCHAR(100),
    metadata_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABELA DE TUTORES & GEOLOCALIZAÇÃO
CREATE TABLE IF NOT EXISTS tutors (
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

-- 6. TABELA DE PETS
CREATE TABLE IF NOT EXISTS pets (
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

-- 7. TABELA DE VETERINÁRIOS & CHAVE PÚBLICA ECDSA
CREATE TABLE IF NOT EXISTS veterinarians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    crmv_number VARCHAR(20) NOT NULL,
    crmv_uf VARCHAR(2) NOT NULL,
    approval_status VARCHAR(20) DEFAULT 'PENDING_APPROVAL',
    approved_by_rt UUID REFERENCES users(id) ON DELETE SET NULL,
    pix_key VARCHAR(100) NOT NULL,
    rating_average NUMERIC(3,2) DEFAULT 5.00,
    public_key_pem TEXT,
    base_location GEOMETRY(Point, 4326),
    base_h3_index VARCHAR(15),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. PROTOCOLOS CLÍNICOS VERSIONADOS (APROVADOS PELO RT)
CREATE TABLE IF NOT EXISTS clinical_protocol_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version_name VARCHAR(50) NOT NULL,
    approved_by_rt UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    is_active BOOLEAN DEFAULT TRUE,
    rules_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. ASSINATURAS E RECORRÊNCIA
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutor_id UUID NOT NULL REFERENCES tutors(id) ON DELETE RESTRICT,
    plan_type VARCHAR(50) NOT NULL,
    monthly_price NUMERIC(10,2) NOT NULL,
    status subscription_status DEFAULT 'ACTIVE',
    gateway_subscription_id VARCHAR(100),
    current_period_start DATE NOT NULL,
    current_period_end DATE NOT NULL,
    loyalty_end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. ATENDIMENTOS (VISITAS PREVENTIVAS DOMICILIARES)
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutor_id UUID NOT NULL REFERENCES tutors(id) ON DELETE RESTRICT,
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE RESTRICT,
    veterinarian_id UUID REFERENCES veterinarians(id) ON DELETE SET NULL,
    scheduled_date DATE NOT NULL,
    time_window_start TIME NOT NULL,
    time_window_end TIME NOT NULL,
    status appointment_status DEFAULT 'REQUESTED',
    distance_km_audited NUMERIC(5,2),
    payout_vet_amount NUMERIC(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. AUDITORIA DE CADEIA DE FRIO (TRAVA TÉRMICA 2°C A 8°C)
CREATE TABLE IF NOT EXISTS cold_chain_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    veterinarian_id UUID NOT NULL REFERENCES veterinarians(id) ON DELETE RESTRICT,
    temperature_celsius NUMERIC(4,1) NOT NULL,
    proof_photo_url TEXT NOT NULL,
    validation_status VARCHAR(20) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    gps_location GEOMETRY(Point, 4326) NOT NULL
);

-- 12. PRONTUÁRIO ELETRÔNICO LEGALMENTE IMUTÁVEL (CFMV + ECDSA + ACEITE TUTOR)
CREATE TABLE IF NOT EXISTS medical_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE RESTRICT,
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE RESTRICT,
    veterinarian_id UUID NOT NULL REFERENCES veterinarians(id) ON DELETE RESTRICT,
    version INT NOT NULL DEFAULT 1,
    has_conflict BOOLEAN DEFAULT FALSE,
    weight_recorded NUMERIC(5,2) NOT NULL,
    temperature_body NUMERIC(4,1) NOT NULL,
    clinical_notes TEXT NOT NULL,
    vaccine_lot_applied VARCHAR(100),
    
    payload_hash_sha256 VARCHAR(64) NOT NULL,
    vet_digital_signature_base64 TEXT NOT NULL,
    vet_signed_at TIMESTAMP WITH TIME ZONE NOT NULL,

    tutor_consent_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    tutor_consent_ip VARCHAR(45) NOT NULL,
    tutor_consent_device_id VARCHAR(100),
    tutor_consent_signature_image_url TEXT,
    tutor_consent_document_version VARCHAR(50) NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TRIGGER FUNCTION DE IMUTABILIDADE COM LOG EM AUDIT_LOGS
CREATE OR REPLACE FUNCTION prevent_medical_record_tampering()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs(
        actor_id,
        action,
        entity_name,
        entity_id,
        ip_address,
        metadata_json
    )
    VALUES (
        NULL,
        'ATTEMPTED_RECORD_TAMPERING',
        'medical_records',
        OLD.id,
        '0.0.0.0',
        json_build_object(
            'violation_type', TG_OP,
            'old_record_id', OLD.id,
            'old_appointment_id', OLD.appointment_id,
            'old_pet_id', OLD.pet_id,
            'attempted_at', CURRENT_TIMESTAMP
        )
    );
    
    RAISE EXCEPTION 'VIOLAÇÃO LEGAL (CFMV): Prontuários médicos não podem ser alterados (UPDATE) ou excluídos (DELETE) após o registro.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_medical_records ON medical_records;
CREATE TRIGGER trg_protect_medical_records
BEFORE UPDATE OR DELETE ON medical_records
FOR EACH ROW EXECUTE FUNCTION prevent_medical_record_tampering();

-- 13. TELEORIENTAÇÃO WEBRTC (LIVEKIT)
CREATE TABLE IF NOT EXISTS teleorientation_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutor_id UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
    veterinarian_id UUID NOT NULL REFERENCES veterinarians(id) ON DELETE CASCADE,
    room_name VARCHAR(100) NOT NULL,
    is_recording_enabled BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE
);

-- 14. FILA DE MENSAGENS OUTBOX WHATSAPP
CREATE TABLE IF NOT EXISTS whatsapp_outbox (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_to VARCHAR(20) NOT NULL,
    message_text TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    retry_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. RECONCILIAÇÃO FINANCEIRA E REPASSES PIX
CREATE TABLE IF NOT EXISTS vet_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    veterinarian_id UUID NOT NULL REFERENCES veterinarians(id) ON DELETE RESTRICT,
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE RESTRICT,
    amount_consultation NUMERIC(10,2) NOT NULL,
    amount_km NUMERIC(10,2) NOT NULL,
    total_payout NUMERIC(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'SCHEDULED',
    paid_at TIMESTAMP WITH TIME ZONE
);

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_tutors_location ON tutors USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_tutors_h3 ON tutors(h3_index_res8);
CREATE INDEX IF NOT EXISTS idx_vets_base_location ON veterinarians USING GIST(base_location);
CREATE INDEX IF NOT EXISTS idx_vets_h3 ON veterinarians(base_h3_index);
CREATE INDEX IF NOT EXISTS idx_cold_chain_gps ON cold_chain_audits USING GIST(gps_location);
CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON appointments(scheduled_date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_tutor_pet ON appointments(tutor_id, pet_id);
CREATE INDEX IF NOT EXISTS idx_appointments_vet ON appointments(veterinarian_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_appointment ON medical_records(appointment_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_pet ON medical_records(pet_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_vet ON medical_records(veterinarian_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_revoked ON user_sessions(user_id, is_revoked);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_name, entity_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_outbox_status ON whatsapp_outbox(status);
CREATE INDEX IF NOT EXISTS idx_vet_payouts_vet_status ON vet_payouts(veterinarian_id, status);
