import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsController } from './appointments.controller';
import { ColdChainService } from './services/cold-chain.service';
import { StorageModule } from '../storage/storage.module';
import { AppointmentEntity } from '../../database/entities/appointment.entity';
import { ColdChainAuditEntity } from '../../database/entities/cold-chain-audit.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AppointmentEntity, ColdChainAuditEntity]),
    StorageModule,
  ],
  controllers: [AppointmentsController],
  providers: [ColdChainService],
  exports: [ColdChainService],
})
export class AppointmentsModule {}
