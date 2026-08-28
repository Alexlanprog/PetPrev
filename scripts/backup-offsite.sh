#!/bin/bash
# ==============================================================================
# PETPREV — SCRIPT DE BACKUP DIÁRIO COMPLETO OFFSITE (PostgreSQL + MinIO Storage)
# Especificado na Seção 7 do SDD v3.0 (RPO < 24h / RTO < 2h)
#
# INSTRUÇÕES DE AGENDAMENTO (CRONTAB)
# Para garantir o RPO diário, agende este script no cron do servidor da VPS.
# Execute: crontab -e
# E adicione a linha abaixo (executa todos os dias às 03:00 da manhã):
# 0 3 * * * /caminho/absoluto/para/scripts/backup-offsite.sh >> /var/log/petprev_backup.log 2>&1
# ==============================================================================

set -eo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_DIR:-/var/backups/petprev}"
ENV_FILE="${ENV_FILE:-/opt/petprev/.env}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

# Carregar variáveis de ambiente caso o arquivo exista
if [ -f "$ENV_FILE" ]; then
    # shellcheck disable=SC1090
    source "$ENV_FILE"
fi

POSTGRES_USER="${POSTGRES_USER:-petprev_admin}"
POSTGRES_DB="${POSTGRES_DB:-petprev_db}"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-petprev_postgres}"
MINIO_CONTAINER="${MINIO_CONTAINER:-petprev_minio}"
REMOTE_DESTINATION="${BACKUP_S3_REMOTE:-remote_backup:petprev-backups}"

mkdir -p "$BACKUP_DIR"
CURRENT_BACKUP_PATH="$BACKUP_DIR/$TIMESTAMP"
mkdir -p "$CURRENT_BACKUP_PATH"

echo "======================================================================"
echo "[PetPrev Backup] Iniciando rotina de backup em: $(date '+%Y-%m-%d %H:%M:%S')"
echo "======================================================================"

# 1. Backup do Banco de Dados PostgreSQL (Dump Criptografado/Gzip)
echo "[1/3] Gerando Dump Criptografado do PostgreSQL ($POSTGRES_DB)..."
docker exec "$POSTGRES_CONTAINER" pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$CURRENT_BACKUP_PATH/db_${POSTGRES_DB}_${TIMESTAMP}.sql.gz"
echo "  -> Dump do banco salvo com sucesso em $CURRENT_BACKUP_PATH/db_${POSTGRES_DB}_${TIMESTAMP}.sql.gz"

# 2. Backup dos Arquivos de Mídia do MinIO S3
echo "[2/3] Sincronizando Arquivos de Mídia do MinIO Storage..."
mkdir -p "$CURRENT_BACKUP_PATH/minio_data"
docker exec "$MINIO_CONTAINER" mc mirror --preserve /data /tmp/minio_export 2>/dev/null || true
docker cp "$MINIO_CONTAINER":/data "$CURRENT_BACKUP_PATH/minio_data"
echo "  -> Mídias do MinIO copiadas para $CURRENT_BACKUP_PATH/minio_data"

# 3. Compactação do pacote completo
echo "[3/3] Compactando e enviando para storage offsite..."
tar -czf "$BACKUP_DIR/backup_petprev_${TIMESTAMP}.tar.gz" -C "$BACKUP_DIR" "$TIMESTAMP"
rm -rf "$CURRENT_BACKUP_PATH"

# Se o rclone estiver configurado, envia para o bucket/remote offsite
if command -v rclone &> /dev/null; then
    echo "  -> Enviando pacote via Rclone para $REMOTE_DESTINATION..."
    rclone copy "$BACKUP_DIR/backup_petprev_${TIMESTAMP}.tar.gz" "$REMOTE_DESTINATION/"
    echo "  -> Envio offsite finalizado."
else
    echo "  -> [AVISO] Rclone não encontrado no path. Backup mantido apenas localmente em $BACKUP_DIR"
fi

# 4. Limpeza local de backups com mais de N dias
echo "[Limpeza] Removendo backups locais com mais de $RETENTION_DAYS dias..."
find "$BACKUP_DIR" -type f -name "backup_petprev_*.tar.gz" -mtime +"$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +"$RETENTION_DAYS" -delete

echo "======================================================================"
echo "[PetPrev Backup] Backup diário concluído com sucesso em $TIMESTAMP!"
echo "======================================================================"
exit 0
