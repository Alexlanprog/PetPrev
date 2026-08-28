import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingController } from './billing.controller';
import { SubscriptionsService } from './services/subscriptions.service';
import { VetPayoutEngineService } from './services/vet-payout-engine.service';
import { SubscriptionEntity } from '../../database/entities/subscription.entity';
import { AuditLogEntity } from '../../database/entities/audit-log.entity';
import { AppointmentEntity } from '../../database/entities/appointment.entity';
import { VetPayoutEntity } from '../../database/entities/vet-payout.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubscriptionEntity,
      AuditLogEntity,
      AppointmentEntity,
      VetPayoutEntity,
    ]),
  ],
  controllers: [BillingController],
  providers: [SubscriptionsService, VetPayoutEngineService],
  exports: [SubscriptionsService, VetPayoutEngineService],
})
export class BillingModule {}
