import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalRecordsController } from './medical-records.controller';
import { MedicalRecordsService } from './services/medical-records.service';
import { CryptoService } from './services/crypto.service';
import { StorageModule } from '../storage/storage.module';
import { MedicalRecordEntity } from '../../database/entities/medical-record.entity';
import { VeterinarianEntity } from '../../database/entities/veterinarian.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MedicalRecordEntity, VeterinarianEntity]),
    StorageModule,
  ],
  controllers: [MedicalRecordsController],
  providers: [MedicalRecordsService, CryptoService],
  exports: [MedicalRecordsService, CryptoService],
})
export class MedicalRecordsModule {}
