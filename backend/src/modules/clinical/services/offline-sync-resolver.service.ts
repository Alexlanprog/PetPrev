import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalRecordEntity } from '../../../database/entities/medical-record.entity';
import { AuditLogEntity } from '../../../database/entities/audit-log.entity';

@Injectable()
export class OfflineSyncResolverService {
  private readonly logger = new Logger(OfflineSyncResolverService.name);

  constructor(
    @InjectRepository(MedicalRecordEntity)
    private readonly medicalRecordRepository: Repository<MedicalRecordEntity>,
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepository: Repository<AuditLogEntity>,
  ) {}

  /**
   * Resolve conflitos de sincronização offline (Versioned Append-Only)
   * Se já existir um prontuário no servidor (baseado no appointment_id e pet_id),
   * ele nunca sobrescreve o anterior. Em vez disso, gera uma versão incrementada
   * e marca com hasConflict = true, para análise do RT (Responsável Técnico).
   */
  public async resolveMedicalRecordSync(incomingRecord: Partial<MedicalRecordEntity>, veterinarianId: string) {
    // Busca registro existente para a mesma visita (appointment_id) e pet_id
    const existingRecord = await this.medicalRecordRepository.findOne({
      where: {
        appointment_id: incomingRecord.appointment_id,
        pet_id: incomingRecord.pet_id,
      },
      order: { version: 'DESC' }, // Pega sempre a versão mais recente
    });

    if (!existingRecord) {
      this.logger.log(`[Sync] Registro primário criado sem conflito para Appointment ID: ${incomingRecord.appointment_id}`);
      return await this.saveRecord({
        ...incomingRecord,
        version: 1,
        has_conflict: false,
      });
    }

    // Estratégia Append-Only: Registro já existe, gera uma nova versão sinalizando conflito.
    const newVersion = existingRecord.version + 1;
    this.logger.warn(`[Sync-Conflito] Novo envio detectado para Appointment ID: ${incomingRecord.appointment_id}. Gerando Versão ${newVersion} com flag de conflito.`);

    const savedRecord = await this.saveRecord({
      ...incomingRecord,
      version: newVersion,
      has_conflict: true,
    });

    // Auditoria para o RT
    await this.auditLogRepository.save(
      this.auditLogRepository.create({
        actor_id: veterinarianId,
        action: 'OFFLINE_SYNC_CONFLICT_CREATED',
        entity_name: 'medical_records',
        entity_id: savedRecord.id,
        ip_address: incomingRecord.tutor_consent_ip || '0.0.0.0',
        metadata_json: {
          previous_record_id: existingRecord.id,
          new_version: newVersion,
          appointment_id: incomingRecord.appointment_id,
        },
      }),
    );

    return savedRecord;
  }

  private async saveRecord(data: Partial<MedicalRecordEntity>): Promise<MedicalRecordEntity> {
    const record = this.medicalRecordRepository.create(data);
    return await this.medicalRecordRepository.save(record);
  }
}
