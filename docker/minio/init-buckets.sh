#!/bin/sh
# ==============================================================================
# PETPREV — SCRIPT DE INICIALIZAÇÃO DE BUCKETS MINIO S3
# Executado via container minio/mc para provisionamento idempotente de buckets
# ==============================================================================

set -e

echo "[MinIO-Init] Aguardando inicialização completa do serviço MinIO..."

# Aguardar até o MinIO responder no host/porta
until (/usr/bin/mc alias set myminio http://${MINIO_ENDPOINT:-minio}:${MINIO_PORT:-9000} ${MINIO_ROOT_USER:-minio_petprev_admin} ${MINIO_ROOT_PASSWORD:-minio_super_secret_storage_pass_change_me}); do
    echo "[MinIO-Init] MinIO ainda não está pronto. Nova tentativa em 2 segundos..."
    sleep 2
done

echo "[MinIO-Init] Conexão estabelecida com sucesso com o MinIO!"

# Lista de buckets essenciais para a operação PetPrev
BUCKETS="petprev-coldchain petprev-records petprev-vaccine-cards petprev-avatars"

for BUCKET in $BUCKETS; do
    if /usr/bin/mc ls myminio/$BUCKET > /dev/null 2>&1; then
        echo "[MinIO-Init] Bucket '$BUCKET' já existe. Nenhuma alteração necessária."
    else
        echo "[MinIO-Init] Criando bucket '$BUCKET'..."
        /usr/bin/mc mb myminio/$BUCKET
        echo "[MinIO-Init] Bucket '$BUCKET' criado com sucesso!"
    fi
done

# Política para avatars: permitir download direto de imagens de perfil públicas
/usr/bin/mc anonymous set download myminio/petprev-avatars || true

# Buckets confidenciais permanecem totalmente privados/autenticados
/usr/bin/mc anonymous set none myminio/petprev-coldchain || true
/usr/bin/mc anonymous set none myminio/petprev-records || true
/usr/bin/mc anonymous set none myminio/petprev-vaccine-cards || true

echo "[MinIO-Init] Provisionamento de buckets e políticas concluído com sucesso!"
exit 0
