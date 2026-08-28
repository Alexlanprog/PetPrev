import { Test, TestingModule } from '@nestjs/testing';
import { WhatsAppQueueConsumer } from '../consumers/whatsapp-queue.consumer';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WhatsAppOutboxEntity } from '../../../database/entities/whatsapp-outbox.entity';
import { Job } from 'bullmq';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WhatsAppQueueConsumer', () => {
  let consumer: WhatsAppQueueConsumer;
  
  const mockOutboxRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'NODE_ENV') return 'production'; // Forçar produção para testar o mock do Axios interno
      if (key === 'MOCK_WHATSAPP') return 'false';
      if (key === 'EVOLUTION_API_URL') return 'http://evo';
      return null;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsAppQueueConsumer,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: getRepositoryToken(WhatsAppOutboxEntity), useValue: mockOutboxRepository },
      ],
    }).compile();

    consumer = module.get<WhatsAppQueueConsumer>(WhatsAppQueueConsumer);
  });

  it('deve processar o job, chamar a API Evolution e salvar status SENT', async () => {
    const mockMessage = {
      id: 'msg-1',
      phone_to: '5511999999999',
      message_text: 'Hello',
      status: 'PENDING',
    };
    mockOutboxRepository.findOne.mockResolvedValue(mockMessage);
    mockOutboxRepository.save.mockImplementation(async (dto) => dto);
    
    mockedAxios.post.mockResolvedValue({ status: 200, data: {} });

    const job = { data: { outboxId: 'msg-1' }, id: 'job-1', attemptsMade: 0 } as Job;

    await consumer.process(job);

    expect(mockedAxios.post).toHaveBeenCalled();
    expect(mockOutboxRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'SENT' })
    );
  });

  it('deve lançar exceção (para retry do BullMQ) se a API falhar', async () => {
    const mockMessage = {
      id: 'msg-2',
      status: 'PENDING',
    };
    mockOutboxRepository.findOne.mockResolvedValue(mockMessage);
    
    mockedAxios.post.mockRejectedValue(new Error('Network Error'));

    const job = { data: { outboxId: 'msg-2' }, id: 'job-2', attemptsMade: 0 } as Job;

    await expect(consumer.process(job)).rejects.toThrow('Network Error');
    expect(mockOutboxRepository.save).not.toHaveBeenCalled();
  });
});
