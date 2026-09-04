import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionEntity } from '../../../database/entities/subscription.entity';
import { TutorEntity } from '../../../database/entities/tutor.entity';
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

export interface CreateSubscriptionDto {
  plan_type: string;
  monthly_price?: number;
}

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepository: Repository<SubscriptionEntity>,
    @InjectRepository(TutorEntity)
    private readonly tutorRepository: Repository<TutorEntity>,
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepository: Repository<AuditLogEntity>,
  ) {}

  /**
   * Inicia ou atualiza a assinatura de um plano para o tutor autenticado
   */
  async createSubscription(userId: string, dto: CreateSubscriptionDto): Promise<SubscriptionEntity> {
    let tutor = await this.tutorRepository.findOne({ where: { user_id: userId } });
    if (!tutor) {
      tutor = this.tutorRepository.create({
        user_id: userId,
        full_name: 'Tutor PetPrev',
        address_street: 'Não informado',
        address_number: 'S/N',
        address_neighborhood: 'Centro',
        address_city: 'Salvador',
        address_zipcode: '40000-000',
        h3_index_res8: '882a1072b5fffff',
      });
      tutor = await this.tutorRepository.save(tutor);
    }

    let price = dto.monthly_price;
    if (!price) {
      const type = (dto.plan_type || '').toUpperCase();
      if (type.includes('ESSENCIAL')) price = 99.90;
      else if (type.includes('PREMIUM')) price = 199.90;
      else price = 149.90; // Padrão Família
    }

    const today = new Date();
    const periodEnd = new Date(today);
    periodEnd.setDate(periodEnd.getDate() + 30);

    const loyaltyEnd = new Date(today);
    loyaltyEnd.setDate(loyaltyEnd.getDate() + 365);

    let subscription = await this.subscriptionRepository.findOne({
      where: { tutor_id: tutor.id, status: SubscriptionStatus.ACTIVE },
    });

    if (subscription) {
      subscription.plan_type = dto.plan_type;
      subscription.monthly_price = price;
      subscription.current_period_end = periodEnd.toISOString().split('T')[0];
    } else {
      subscription = this.subscriptionRepository.create({
        tutor_id: tutor.id,
        plan_type: dto.plan_type,
        monthly_price: price,
        status: SubscriptionStatus.ACTIVE,
        gateway_subscription_id: `sub_sim_${Date.now()}`,
        current_period_start: today.toISOString().split('T')[0],
        current_period_end: periodEnd.toISOString().split('T')[0],
        loyalty_end_date: loyaltyEnd.toISOString().split('T')[0],
      });
    }

    const saved = await this.subscriptionRepository.save(subscription);
    this.logger.log(`Assinatura ativada com sucesso: ${saved.id} (Plano: ${saved.plan_type})`);
    return saved;
  }

  /**
   * Retorna a assinatura ativa do tutor autenticado
   */
  async getTutorSubscription(userId: string): Promise<SubscriptionEntity | null> {
    const tutor = await this.tutorRepository.findOne({ where: { user_id: userId } });
    if (!tutor) return null;

    return await this.subscriptionRepository.findOne({
      where: { tutor_id: tutor.id, status: SubscriptionStatus.ACTIVE },
      order: { created_at: 'DESC' },
    });
  }

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
          ip_address: '0.0.0.0',
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
