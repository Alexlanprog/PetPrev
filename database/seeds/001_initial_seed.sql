-- ==============================================================================
-- PETPREV — SEED INICIAL: USUÁRIOS E PROTOCOLO CLÍNICO VACINAL DO RT
-- Baseado no PDD v4.3 e SDD v3.0 (Regras Vacinais Parametrizadas)
-- ==============================================================================

-- 1. USUÁRIO ADMIN GERAL
INSERT INTO users (id, email, phone_number, cpf, role, is_active)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'admin@petprev.com.br',
    '+5511999990001',
    '000.000.000-01',
    'ADMIN_GERAL',
    TRUE
)
ON CONFLICT (phone_number) DO NOTHING;

-- 2. USUÁRIO VETERINÁRIO RESPONSÁVEL TÉCNICO (RT)
INSERT INTO users (id, email, phone_number, cpf, role, is_active)
VALUES (
    'a0000000-0000-0000-0000-000000000002',
    'rt.veterinario@petprev.com.br',
    '+5511999990002',
    '000.000.000-02',
    'VET_RESPONSAVEL_TECNICO',
    TRUE
)
ON CONFLICT (phone_number) DO NOTHING;

-- 3. PERFIL DO VETERINÁRIO RT NA TABELA VETERINARIANS
INSERT INTO veterinarians (
    id,
    user_id,
    full_name,
    crmv_number,
    crmv_uf,
    approval_status,
    pix_key,
    rating_average,
    base_location,
    base_h3_index
)
VALUES (
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000002',
    'Dr. Responsável Técnico PetPrev CRMV-SP',
    '12345',
    'SP',
    'APPROVED',
    'rt@petprev.com.br',
    5.00,
    ST_SetSRID(ST_MakePoint(-46.655881, -23.561414), 4326), -- Av. Paulista, SP
    '88a8100c19fffff'
)
ON CONFLICT DO NOTHING;

-- 4. PROTOCOLO CLÍNICO VACINAL INICIAL (PROTOCOLO_PETPREV_2026_V1) APROVADO PELO RT
INSERT INTO clinical_protocol_versions (
    id,
    version_name,
    approved_by_rt,
    is_active,
    rules_json
)
VALUES (
    'c0000000-0000-0000-0000-000000000001',
    'PROTOCOLO_PETPREV_2026_V1',
    'a0000000-0000-0000-0000-000000000002',
    TRUE,
    '[
        {
            "species": "CANINE",
            "minAgeWeeks": 6,
            "maxAgeWeeks": 8,
            "doseLabel": "PUPPY_DOSE_1",
            "requiredVaccines": ["V10_CANINE"],
            "nextDoseWindowDays": {"min": 21, "max": 28}
        },
        {
            "species": "CANINE",
            "minAgeWeeks": 9,
            "maxAgeWeeks": 12,
            "doseLabel": "PUPPY_DOSE_2",
            "requiredVaccines": ["V10_CANINE", "CANINE_FLU"],
            "nextDoseWindowDays": {"min": 21, "max": 28}
        },
        {
            "species": "CANINE",
            "minAgeWeeks": 13,
            "maxAgeWeeks": 16,
            "doseLabel": "PUPPY_DOSE_3_AND_RABIES",
            "requiredVaccines": ["V10_CANINE", "RABIES"],
            "nextDoseWindowDays": {"min": 330, "max": 365}
        },
        {
            "species": "CANINE",
            "minAgeWeeks": 52,
            "maxAgeWeeks": 1200,
            "doseLabel": "ANNUAL_BOOSTER",
            "requiredVaccines": ["V10_CANINE", "RABIES", "CANINE_FLU"],
            "nextDoseWindowDays": {"min": 330, "max": 365}
        },
        {
            "species": "FELINE",
            "minAgeWeeks": 8,
            "maxAgeWeeks": 10,
            "doseLabel": "KITTEN_DOSE_1",
            "requiredVaccines": ["V4_FELINE"],
            "nextDoseWindowDays": {"min": 21, "max": 28}
        },
        {
            "species": "FELINE",
            "minAgeWeeks": 11,
            "maxAgeWeeks": 16,
            "doseLabel": "KITTEN_DOSE_2_AND_RABIES",
            "requiredVaccines": ["V4_FELINE", "RABIES"],
            "nextDoseWindowDays": {"min": 330, "max": 365}
        },
        {
            "species": "FELINE",
            "minAgeWeeks": 52,
            "maxAgeWeeks": 1200,
            "doseLabel": "ANNUAL_BOOSTER",
            "requiredVaccines": ["V4_FELINE", "RABIES"],
            "nextDoseWindowDays": {"min": 330, "max": 365}
        }
    ]'::jsonb
)
ON CONFLICT DO NOTHING;
