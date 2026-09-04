import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingController } from './billing.controller';
import { SubscriptionsService } from './services/subscriptions.service';
import { VetPayoutEngineService } from './services/vet-payout-engine.service';
import { SubscriptionEntity } from '../../database/entities/subscription.entity';
import { AuditLogEntity } from '../../database/entities/audit-log.entity';
import { AppointmentEntity } from '../../database/entities/appointment.entity';
import { VetPayoutEntity } from '../../database/entities/vet-payout.entity';
import { TutorEntity } from '../../database/entities/tutor.entity';

import { AsaasWebhookGuard } from './guards/asaas-webhook.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubscriptionEntity,
      AuditLogEntity,
      AppointmentEntity,
      VetPayoutEntity,
      TutorEntity,
    ]),
  ],
  controllers: [BillingController],
  providers: [SubscriptionsService, VetPayoutEngineService, AsaasWebhookGuard],
  exports: [SubscriptionsService, VetPayoutEngineService, AsaasWebhookGuard],
})
export class BillingModule {}
