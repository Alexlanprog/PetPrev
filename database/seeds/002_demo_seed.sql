-- ==============================================================================
-- PETPREV — SEED DE DEMONSTRAÇÃO COMPLETO
-- Cria Tutor (Ana Ribeiro), Pets (Thor e Mia), Vet (Dra. Camila) e Agendamentos
-- ==============================================================================

-- 1. USUÁRIO TUTOR (Ana Ribeiro)
INSERT INTO users (id, email, phone_number, cpf, role, is_active)
VALUES (
    'a0000000-0000-0000-0000-000000000010',
    'ana.ribeiro@petprev.com.br',
    '+5571999990001',
    '111.111.111-11',
    'TUTOR',
    TRUE
)
ON CONFLICT (phone_number) DO NOTHING;

-- 2. PERFIL DO TUTOR
INSERT INTO tutors (
    id,
    user_id,
    full_name,
    address_street,
    address_number,
    address_neighborhood,
    address_city,
    address_zipcode,
    h3_index_res8
)
VALUES (
    'b0000000-0000-0000-0000-000000000010',
    'a0000000-0000-0000-0000-000000000010',
    'Ana Ribeiro',
    'Rua das Hortênsias',
    '420',
    'Pituba',
    'Salvador',
    '41810-010',
    '8a2a1072b59ffff'
)
ON CONFLICT DO NOTHING;

-- 3. USUÁRIO VETERINÁRIA DE CAMPO (Dra. Camila Souza)
INSERT INTO users (id, email, phone_number, cpf, role, is_active)
VALUES (
    'a0000000-0000-0000-0000-000000000020',
    'camila.souza@petprev.com.br',
    '+5571999990003',
    '333.333.333-33',
    'VET_FIELD',
    TRUE
)
ON CONFLICT (phone_number) DO NOTHING;

-- 4. PERFIL DA VETERINÁRIA
INSERT INTO veterinarians (
    id,
    user_id,
    full_name,
    crmv_number,
    crmv_uf,
    approval_status,
    pix_key,
    rating_average,
    base_h3_index
)
VALUES (
    'b0000000-0000-0000-0000-000000000020',
    'a0000000-0000-0000-0000-000000000020',
    'Dra. Camila Souza',
    '12345',
    'BA',
    'APPROVED',
    'camila.vet@petprev.com.br',
    4.95,
    '8a2a1072b59ffff'
)
ON CONFLICT DO NOTHING;

-- 5. PETS
INSERT INTO pets (id, tutor_id, name, species, breed, gender, birth_date, weight_kg, is_active)
VALUES 
(
    'c0000000-0000-0000-0000-000000000011',
    'b0000000-0000-0000-0000-000000000010',
    'Thor',
    'CANINE',
    'Golden Retriever',
    'M',
    '2022-04-10',
    32.40,
    TRUE
),
(
    'c0000000-0000-0000-0000-000000000012',
    'b0000000-0000-0000-0000-000000000010',
    'Mia',
    'FELINE',
    'SRD',
    'F',
    '2024-02-15',
    4.10,
    TRUE
)
ON CONFLICT DO NOTHING;

-- 6. ASSINATURA
INSERT INTO subscriptions (
    id,
    tutor_id,
    plan_type,
    monthly_price,
    status,
    gateway_subscription_id,
    current_period_start,
    current_period_end,
    loyalty_end_date
)
VALUES (
    'd0000000-0000-0000-0000-000000000010',
    'b0000000-0000-0000-0000-000000000010',
    'Família',
    149.90,
    'ACTIVE',
    'sub_demo_active_01',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    CURRENT_DATE + INTERVAL '365 days'
)
ON CONFLICT DO NOTHING;

-- 7. AGENDAMENTOS
INSERT INTO appointments (
    id,
    tutor_id,
    pet_id,
    veterinarian_id,
    scheduled_date,
    time_window_start,
    time_window_end,
    status
)
VALUES 
(
    'e0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000010',
    'c0000000-0000-0000-0000-000000000011',
    'b0000000-0000-0000-0000-000000000020',
    CURRENT_DATE,
    '14:00:00',
    '18:00:00',
    'EN_ROUTE'
),
(
    'e0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000010',
    'c0000000-0000-0000-0000-000000000011',
    'b0000000-0000-0000-0000-000000000020',
    CURRENT_DATE - INTERVAL '1 day',
    '09:00:00',
    '11:00:00',
    'COMPLETED'
)
ON CONFLICT DO NOTHING;
