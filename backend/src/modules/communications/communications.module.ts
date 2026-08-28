import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { CommunicationsController } from './communications.controller';
import { TeleorientationService } from './services/teleorientation.service';
import { WhatsAppQueueConsumer } from './consumers/whatsapp-queue.consumer';
import { WhatsAppOutboxEntity } from '../../database/entities/whatsapp-outbox.entity';
import { TeleorientationSessionEntity } from '../../database/entities/teleorientation-session.entity';
import { AppointmentEntity } from '../../database/entities/appointment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WhatsAppOutboxEntity,
      TeleorientationSessionEntity,
      AppointmentEntity,
    ]),
    // Registra a fila para envio de mensagens
    BullModule.registerQueue({
      name: 'whatsapp-queue',
    }),
  ],
  controllers: [CommunicationsController],
  providers: [TeleorientationService, WhatsAppQueueConsumer],
  exports: [TeleorientationService],
})
export class CommunicationsModule {}
