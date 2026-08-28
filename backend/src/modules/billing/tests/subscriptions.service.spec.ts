import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsService, AsaasWebhookPayload } from '../services/subscriptions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SubscriptionEntity } from '../../../database/entities/subscription.entity';
import { SubscriptionStatus } from '../../../database/enums';
import { AuditLogEntity } from '../../../database/entities/audit-log.entity';
import { NotFoundException } from '@nestjs/common';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  
  const mockSubscriptionRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockAuditLogRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: getRepositoryToken(SubscriptionEntity), useValue: mockSubscriptionRepository },
        { provide: getRepositoryToken(AuditLogEntity), useValue: mockAuditLogRepository },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  it('deve transicionar status para ACTIVE quando PAYMENT_CONFIRMED for recebido', async () => {
    mockSubscriptionRepository.findOne.mockResolvedValue({
      id: 'sub-1',
      gateway_subscription_id: 'sub_asaas_123',
      status: SubscriptionStatus.PENDING_PAYMENT,
    });
    mockSubscriptionRepository.save.mockImplementation(async (dto) => dto);
    mockAuditLogRepository.create.mockImplementation((dto) => dto);

    const payload: AsaasWebhookPayload = {
      event: 'PAYMENT_CONFIRMED',
      payment: { subscription: 'sub_asaas_123', customer: 'cus_1', value: 59.90, dueDate: '2023-10-01' },
    };

    await service.processWebhook(payload);

    expect(mockSubscriptionRepository.save).toHaveBeenCalledWith(expect.objectContaining({ status: SubscriptionStatus.ACTIVE }));
    expect(mockAuditLogRepository.save).toHaveBeenCalled();
  });

  it('deve transicionar status para SUSPENDED_OVERDUE quando PAYMENT_OVERDUE for recebido', async () => {
    mockSubscriptionRepository.findOne.mockResolvedValue({
      id: 'sub-1',
      gateway_subscription_id: 'sub_asaas_123',
      status: SubscriptionStatus.ACTIVE,
    });
    mockSubscriptionRepository.save.mockImplementation(async (dto) => dto);
    mockAuditLogRepository.create.mockImplementation((dto) => dto);

    const payload: AsaasWebhookPayload = {
      event: 'PAYMENT_OVERDUE',
      payment: { subscription: 'sub_asaas_123', customer: 'cus_1', value: 59.90, dueDate: '2023-10-01' },
    };

    await service.processWebhook(payload);

    expect(mockSubscriptionRepository.save).toHaveBeenCalledWith(expect.objectContaining({ status: SubscriptionStatus.SUSPENDED_OVERDUE }));
  });

  it('deve lançar NotFoundException se a assinatura não existir no banco', async () => {
    mockSubscriptionRepository.findOne.mockResolvedValue(null);

    const payload: AsaasWebhookPayload = {
      event: 'PAYMENT_CONFIRMED',
      payment: { subscription: 'sub_inexistente', customer: 'cus_1', value: 59.90, dueDate: '2023-10-01' },
    };

    await expect(service.processWebhook(payload)).rejects.toThrow(NotFoundException);
  });
});
