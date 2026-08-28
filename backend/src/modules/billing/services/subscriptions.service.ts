import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionEntity } from '../../../database/entities/subscription.entity';
import { SubscriptionStatus } from '../../../database/enums';
import { AuditLogEntity } from '../../../database/entities/audit-log.entity';

export interface AsaasWebhookPayload {
  event: 'PAYMENT_CONFIRMED' | 'PAYMENT_RECEIVED' | 'PAYMENT_OVERDUE' | 'PAYMENT_DELETED' | 'SUBSCRIPTION_CANCELED';
  payment: {
    subscription: string; // ID da assinatura no gateway
    customer: string; // ID do cliente (tutor) no gateway
    value: number;
    dueDate: string;
  };
}

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepository: Repository<SubscriptionEntity>,
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepository: Repository<AuditLogEntity>,
  ) {}

  /**
   * Processa o webhook de pagamentos do Asaas (ou simular)
   * e executa a máquina de estados da assinatura.
   */
  async processWebhook(payload: AsaasWebhookPayload): Promise<void> {
    const gatewaySubId = payload.payment.subscription;
    if (!gatewaySubId) {
      this.logger.warn('Webhook ignorado: ID de assinatura ausente no payload.');
      return;
    }

    const subscription = await this.subscriptionRepository.findOne({
      where: { gateway_subscription_id: gatewaySubId },
    });

    if (!subscription) {
      this.logger.error(`Assinatura não encontrada para o gateway ID: ${gatewaySubId}`);
      throw new NotFoundException('Assinatura correspondente não encontrada no banco.');
    }

    const previousStatus = subscription.status;
    let newStatus = previousStatus;

    // Máquina de estados baseada nos eventos do Asaas
    switch (payload.event) {
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED':
        newStatus = SubscriptionStatus.ACTIVE;
        break;
      case 'PAYMENT_OVERDUE':
        newStatus = SubscriptionStatus.SUSPENDED_OVERDUE;
        break;
      case 'PAYMENT_DELETED':
      case 'SUBSCRIPTION_CANCELED':
        newStatus = SubscriptionStatus.CANCELED;
        break;
      default:
        this.logger.log(`Evento ${payload.event} ignorado, sem transição de estado mapeada.`);
        return;
    }

    // Se houve mudança de status, atualiza e audita
    if (newStatus !== previousStatus) {
      subscription.status = newStatus;
      await this.subscriptionRepository.save(subscription);
      
      this.logger.log(`Assinatura ${subscription.id} alterada de ${previousStatus} para ${newStatus}`);

      await this.auditLogRepository.save(
        this.auditLogRepository.create({
          actor_id: '00000000-0000-0000-0000-000000000000',
          action: 'SUBSCRIPTION_STATUS_CHANGED',
          entity_name: 'subscriptions',
          entity_id: subscription.id,
          ip_address: '0.0.0.0', // Origin IP could be passed from controller
          metadata_json: {
            previous_status: previousStatus,
            new_status: newStatus,
            gateway_event: payload.event,
          },
        }),
      );
    }
  }
}
