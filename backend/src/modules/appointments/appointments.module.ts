import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsController } from './appointments.controller';
import { ColdChainService } from './services/cold-chain.service';
import { AppointmentsService } from './services/appointments.service';
import { StorageModule } from '../storage/storage.module';
import { TutorsModule } from '../tutors/tutors.module';
import { BillingModule } from '../billing/billing.module';
import { AppointmentEntity } from '../../database/entities/appointment.entity';
import { ColdChainAuditEntity } from '../../database/entities/cold-chain-audit.entity';
import { TutorEntity } from '../../database/entities/tutor.entity';
import { VeterinarianEntity } from '../../database/entities/veterinarian.entity';
import { PetEntity } from '../../database/entities/pet.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AppointmentEntity,
      ColdChainAuditEntity,
      TutorEntity,
      VeterinarianEntity,
      PetEntity,
    ]),
    StorageModule,
    TutorsModule,
    forwardRef(() => BillingModule),
  ],
  controllers: [AppointmentsController],
  providers: [ColdChainService, AppointmentsService],
  exports: [ColdChainService, AppointmentsService],
})
export class AppointmentsModule {}
