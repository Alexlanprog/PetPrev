import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhatsAppOutboxEntity } from '../../../database/entities/whatsapp-outbox.entity';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Processor('whatsapp-queue')
export class WhatsAppQueueConsumer extends WorkerHost {
  private readonly logger = new Logger(WhatsAppQueueConsumer.name);

  constructor(
    @InjectRepository(WhatsAppOutboxEntity)
    private readonly outboxRepository: Repository<WhatsAppOutboxEntity>,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { outboxId } = job.data;
    this.logger.log(`Iniciando processamento do job WhatsApp: ${job.id}, Outbox ID: ${outboxId}`);

    const message = await this.outboxRepository.findOne({ where: { id: outboxId } });
    
    if (!message) {
      this.logger.warn(`Mensagem ${outboxId} não encontrada no Outbox. Encerrando job.`);
      return;
    }

    if (message.status === 'SENT') {
      this.logger.log(`Mensagem ${outboxId} já enviada anteriormente.`);
      return;
    }

    const evolutionApiUrl = this.configService.get<string>('EVOLUTION_API_URL', 'http://localhost:8080');
    const evolutionApiKey = this.configService.get<string>('EVOLUTION_API_KEY', 'default_key');
    const evolutionInstance = this.configService.get<string>('EVOLUTION_INSTANCE_NAME', 'petprev_bot');

    const payload = {
      number: message.phone_to,
      options: { delay: 1200, presence: 'composing' },
      textMessage: { text: message.message_text },
    };

    try {
      // Verifica se estamos em modo de teste/dev para não enviar SMS real
      const isTestEnv = this.configService.get<string>('NODE_ENV') === 'test' || this.configService.get<string>('MOCK_WHATSAPP') === 'true';

      if (!isTestEnv) {
        // Envio Real
        await axios.post(
          `${evolutionApiUrl}/message/sendText/${evolutionInstance}`,
          payload,
          {
            headers: {
              apikey: evolutionApiKey,
              'Content-Type': 'application/json',
            },
          }
        );
      } else {
        // Mock do envio
        this.logger.debug(`[MOCK WHATSAPP] Simulando envio para ${message.phone_to}: ${message.message_text}`);
        // Simulando delay de rede
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      message.status = 'SENT';
      await this.outboxRepository.save(message);

      this.logger.log(`Mensagem ${outboxId} processada com sucesso e marcada como SENT.`);

    } catch (error) {
      this.logger.error(`Falha ao enviar mensagem ${outboxId} (Tentativa ${job.attemptsMade + 1}): ${error.message}`);
      
      // Como o BullMQ vai jogar o Job pra Retry (dependendo da config da fila no producer),
      // só marcamos FAILED se não houver mais tentativas no catch do failed hook, 
      // mas para simplificar aqui, vamos apenas lançar o erro pro BullMQ gerenciar.
      throw error; 
    }
  }
}
