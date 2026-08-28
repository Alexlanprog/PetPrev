import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClinicalController } from './clinical.controller';
import { OfflineSyncResolverService } from './services/offline-sync-resolver.service';
import { MedicalRecordEntity } from '../../database/entities/medical-record.entity';
import { AuditLogEntity } from '../../database/entities/audit-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MedicalRecordEntity, AuditLogEntity])],
  controllers: [ClinicalController],
  providers: [OfflineSyncResolverService],
  exports: [OfflineSyncResolverService],
})
export class ClinicalModule {}
