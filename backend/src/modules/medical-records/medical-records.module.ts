import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalRecordsController } from './medical-records.controller';
import { MedicalRecordsService } from './services/medical-records.service';
import { CryptoService } from './services/crypto.service';
import { StorageModule } from '../storage/storage.module';
import { MedicalRecordEntity } from '../../database/entities/medical-record.entity';
import { VeterinarianEntity } from '../../database/entities/veterinarian.entity';
import { PetEntity } from '../../database/entities/pet.entity';
import { AppointmentEntity } from '../../database/entities/appointment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MedicalRecordEntity,
      VeterinarianEntity,
      PetEntity,
      AppointmentEntity,
    ]),
    StorageModule,
  ],
  controllers: [MedicalRecordsController],
  providers: [MedicalRecordsService, CryptoService],
  exports: [MedicalRecordsService, CryptoService],
})
export class MedicalRecordsModule {}
