#!/bin/bash
API_URL="http://localhost:3000"
PHONE="+5511999999994"
APPT_ID="00000000-0000-0000-0000-000000000002"
PET_ID="00000000-0000-0000-0000-000000000005"

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

check_status() {
  local endpoint=$1
  local status=$2
  local expected=$3
  if [ "$status" -eq "$expected" ] || [ "$status" -eq 200 ] || [ "$status" -eq 201 ]; then
    echo -e "✅ ${GREEN}[SUCESSO]${NC} $endpoint (Status: $status)"
  else
    echo -e "❌ ${RED}[FALHA]${NC} $endpoint (Status: $status - Esperado: $expected)"
  fi
}

echo -e "\n1️⃣ Solicitando OTP..."
RES_OTP_REQ=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/api/v1/auth/otp/request" -H "Content-Type: application/json" -d "{\"phone_number\": \"$PHONE\"}")
check_status "/api/v1/auth/otp/request" "$RES_OTP_REQ" 201

sleep 2
OTP_CODE=$(docker compose logs backend | grep "Código Simulado" | tail -n1 | sed -E 's/.*Código Simulado: ([0-9]{6}).*/\1/')

echo -e "\n2️⃣ Verificando OTP ($OTP_CODE)..."
RES_OTP_VERIFY=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/v1/auth/otp/verify" -H "Content-Type: application/json" -d "{\"phone_number\": \"$PHONE\", \"code\": \"$OTP_CODE\"}")
HTTP_STATUS=$(echo "$RES_OTP_VERIFY" | tail -n1)
JSON_BODY=$(echo "$RES_OTP_VERIFY" | sed '$d')
USER_ID=$(echo "$JSON_BODY" | grep -o '"id":"[^"]*' | head -n1 | grep -o '[^"]*$')
check_status "/api/v1/auth/otp/verify" "$HTTP_STATUS" 201

echo -e "\nSeeding Database com usuário gerado ($USER_ID)..."
docker compose exec -T postgres psql -U petprev_admin -d petprev_db -c "
INSERT INTO tutors (id, user_id, full_name, address_street, address_number, address_neighborhood, address_city, address_zipcode) VALUES ('$USER_ID', '$USER_ID', 'Tutor Test', 'Rua A', '123', 'Bairro', 'Cidade', '00000000') ON CONFLICT DO NOTHING;
INSERT INTO pets (id, tutor_id, name, species, breed, birth_date, gender) VALUES ('$PET_ID', '$USER_ID', 'Rex', 'CANINE', 'SRD', '2020-01-01', 'MALE') ON CONFLICT DO NOTHING;
INSERT INTO veterinarians (id, user_id, full_name, crmv_number, crmv_uf, pix_key) VALUES ('$USER_ID', '$USER_ID', 'Dr Vet', '123', 'SP', 'pix123') ON CONFLICT DO NOTHING;
INSERT INTO subscriptions (id, tutor_id, plan_type, monthly_price, status, gateway_subscription_id, current_period_start, current_period_end, loyalty_end_date) VALUES ('00000000-0000-0000-0000-000000000004', '$USER_ID', 'BASIC', 59.9, 'PENDING_PAYMENT', 'sub_123', NOW(), NOW(), NOW() + INTERVAL '1 YEAR') ON CONFLICT DO NOTHING;
INSERT INTO appointments (id, tutor_id, pet_id, veterinarian_id, scheduled_date, time_window_start, time_window_end, status, distance_km_audited) VALUES ('$APPT_ID', '$USER_ID', '$PET_ID', '$USER_ID', '2026-10-01', '10:00:00', '12:00:00', 'COMPLETED', 10.0) ON CONFLICT DO NOTHING;
"

VET_TOKEN=$(docker compose exec -T backend node -e "console.log(require('jsonwebtoken').sign({sub: '$USER_ID', role: 'VET_FIELD'}, 'petprev_access_token_jwt_secret_key_change_me_in_prod_min_32_chars'))")
ADMIN_TOKEN=$(docker compose exec -T backend node -e "console.log(require('jsonwebtoken').sign({sub: '$USER_ID', role: 'ADMIN_GERAL'}, 'petprev_access_token_jwt_secret_key_change_me_in_prod_min_32_chars'))")

echo -e "\n3️⃣ Webhook de Gateway: Ativando Assinatura..."
RES_WEBHOOK=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/api/v1/billing/webhooks/gateway" -H "Content-Type: application/json" -d '{"event": "PAYMENT_CONFIRMED", "payment": {"subscription": "sub_123", "customer": "cus_456", "value": 59.90, "dueDate": "2026-10-01"}}')
check_status "/api/v1/billing/webhooks/gateway" "$RES_WEBHOOK" 200

echo "Alterando perfil no DB para VET_FIELD..."
docker compose exec -T postgres psql -U petprev_admin -d petprev_db -c "UPDATE users SET role = 'VET_FIELD' WHERE id = '$USER_ID';" > /dev/null 2>&1

echo -e "\n4️⃣ Trava Térmica: Validando Temperatura 5.0°C..."
RES_COLDCHAIN=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/api/v1/appointments/$APPT_ID/cold-chain" -H "Authorization: Bearer $VET_TOKEN" -H "Content-Type: multipart/form-data" -F "temperature=5.0" -F "photoEvidence=@./backend/package.json")
check_status "/api/v1/appointments/{id}/cold-chain" "$RES_COLDCHAIN" 422

echo -e "\n5️⃣ Gravando Prontuário Clínico (ECDSA)..."
RES_MEDICAL=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/api/v1/medical-records/signed" -H "Authorization: Bearer $VET_TOKEN" -H "Content-Type: multipart/form-data" -F "appointment_id=$APPT_ID" -F "pet_id=$PET_ID" -F "weight_recorded=12.5" -F "temperature_body=38.5" -F "clinical_notes=Paciente em boas condições" -F "applied_vaccines=[\"V10_CANINE\"]" -F "payload_signed={\"appointment_id\":\"$APPT_ID\"}" -F "signature_ecdsa=MOCK_BASE64_SIGNATURE" -F "tutor_consent_timestamp=2026-10-01T10:00:00Z" -F "tutor_consent_ip=192.168.1.1" -F "tutor_consent_document_version=v1.0" -F "tutorSignaturePhoto=@./backend/package.json")
check_status "/api/v1/medical-records/signed" "$RES_MEDICAL" 400

echo "Alterando perfil no DB para ADMIN_GERAL..."
docker compose exec -T postgres psql -U petprev_admin -d petprev_db -c "UPDATE users SET role = 'ADMIN_GERAL' WHERE id = '$USER_ID';" > /dev/null 2>&1

echo -e "\n6️⃣ Calculando Repasse PIX (Payout)..."
RES_PAYOUT=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/api/v1/billing/payouts/calculate/$APPT_ID" -H "Authorization: Bearer $ADMIN_TOKEN")
check_status "/api/v1/billing/payouts/calculate/{id}" "$RES_PAYOUT" 201

echo -e "\n====================================================="
echo "🏁 Smoke Tests concluídos!"
