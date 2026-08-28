import { Injectable, Logger, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ColdChainAuditEntity } from '../../../database/entities/cold-chain-audit.entity';
import { AppointmentEntity } from '../../../database/entities/appointment.entity';
import { AppointmentStatus } from '../../../database/enums';
import { StorageService } from '../../storage/storage.service';

@Injectable()
export class ColdChainService {
  private readonly logger = new Logger(ColdChainService.name);

  // Intervalo seguro exigido pela vigilância sanitária e CFMV
  private readonly MIN_TEMP = 2.0;
  private readonly MAX_TEMP = 8.0;

  constructor(
    @InjectRepository(ColdChainAuditEntity)
    private readonly coldChainRepository: Repository<ColdChainAuditEntity>,
    @InjectRepository(AppointmentEntity)
    private readonly appointmentRepository: Repository<AppointmentEntity>,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Avalia a temperatura da caixa térmica (Cadeia de Frio).
   * Se inválida, bloqueia e altera o status do agendamento para FAILED_ABSENT (ou mantém travado).
   * Se válida, aprova e transiciona o agendamento para IN_PROGRESS.
   */
  async registerAudit(
    appointmentId: string,
    veterinarianId: string,
    measuredTemperature: number,
    fileBuffer: Buffer,
    fileName: string,
    mimetype: string,
  ): Promise<ColdChainAuditEntity> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId, veterinarian_id: veterinarianId },
    });

    if (!appointment) {
      throw new UnprocessableEntityException('Agendamento não encontrado ou não pertence ao veterinário informado.');
    }

    // Validação da temperatura
    const isApproved = measuredTemperature >= this.MIN_TEMP && measuredTemperature <= this.MAX_TEMP;
    // Faz o upload da evidência no MinIO
    const photoUrl = await this.storageService.uploadFile('petprev-coldchain', fileName, fileBuffer, mimetype);

    // Registra a auditoria
    const audit = this.coldChainRepository.create({
      appointment_id: appointmentId,
      veterinarian_id: veterinarianId,
      temperature_celsius: measuredTemperature,
      proof_photo_url: photoUrl,
      validation_status: isApproved ? 'VALID' : 'BLOCKED_OUT_OF_RANGE',
      // gps_location: ponto fixo ou lido do metadado da foto
      gps_location: {
        type: 'Point',
        coordinates: [-46.633308, -23.55052],
      },
    });

    await this.coldChainRepository.save(audit);

    if (isApproved) {
      this.logger.log(`[ColdChain] Temperatura ${measuredTemperature} aprovada. Appointment ${appointmentId} -> IN_PROGRESS.`);
      appointment.status = AppointmentStatus.IN_PROGRESS;
      await this.appointmentRepository.save(appointment);
    } else {
      this.logger.warn(`[ColdChain] Temperatura ${measuredTemperature} REJEITADA. Aplicação bloqueada para o Appointment ${appointmentId}.`);
      // Lança exceção para barrar o avanço no app, mantendo a responsabilidade no fluxo do client
      throw new UnprocessableEntityException(`Cadeia de frio violada (Temperatura: ${measuredTemperature}°C). A aplicação de vacinas foi bloqueada.`);
    }

    return audit;
  }
}
