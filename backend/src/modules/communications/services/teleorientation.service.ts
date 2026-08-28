import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken } from 'livekit-server-sdk';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeleorientationSessionEntity } from '../../../database/entities/teleorientation-session.entity';
import { AppointmentEntity } from '../../../database/entities/appointment.entity';
import { AppointmentStatus } from '../../../database/enums';

@Injectable()
export class TeleorientationService {
  private readonly logger = new Logger(TeleorientationService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(TeleorientationSessionEntity)
    private readonly teleorientationRepository: Repository<TeleorientationSessionEntity>,
    @InjectRepository(AppointmentEntity)
    private readonly appointmentRepository: Repository<AppointmentEntity>,
  ) {}

  /**
   * Cria ou recupera uma sala de teleorientação, gerando o Token JWT do LiveKit.
   * Regras estritas: is_recording_enabled = false. Máx 20 min (1200 seg).
   */
  async generateRoomToken(appointmentId: string, userId: string, isVet: boolean): Promise<string> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
      relations: ['tutor', 'veterinarian'],
    });

    if (!appointment) {
      throw new InternalServerErrorException('Agendamento não encontrado.');
    }

    // Apenas pode iniciar se estiver agendado ou em andamento
    if (appointment.status === AppointmentStatus.CANCELED || appointment.status === AppointmentStatus.FAILED_ABSENT) {
      throw new InternalServerErrorException('Agendamento cancelado ou falho. Não é possível iniciar a chamada.');
    }

    const roomName = `room_appt_${appointmentId}`;
    const participantIdentity = isVet ? `vet_${userId}` : `tutor_${userId}`;
    const participantName = isVet ? 'Médico Veterinário' : 'Tutor';

    // Cria/Busca a sessão no banco para registro
    let session = await this.teleorientationRepository.findOne({ where: { room_name: roomName } });
    if (!session) {
      session = this.teleorientationRepository.create({
        tutor_id: appointment.tutor_id,
        veterinarian_id: appointment.veterinarian_id || userId,
        room_name: roomName,
        is_recording_enabled: false, // Regra CFMV: Gravação proibida
      });
      await this.teleorientationRepository.save(session);
    }

    const livekitApiKey = this.configService.get<string>('LIVEKIT_API_KEY');
    const livekitApiSecret = this.configService.get<string>('LIVEKIT_API_SECRET');

    if (!livekitApiKey || !livekitApiSecret) {
      this.logger.error('Credenciais do LiveKit ausentes no .env.');
      throw new InternalServerErrorException('Falha de configuração de infraestrutura de vídeo.');
    }

    // Configurando AccessToken (LiveKit Server SDK)
    const at = new AccessToken(livekitApiKey, livekitApiSecret, {
      identity: participantIdentity,
      name: participantName,
      ttl: 1200, // 20 minutos de expiração máxima do token
    });

    // Permissões dentro da sala
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      // Garante explicitamente no JWT que não tem permissão para iniciar gravação
      roomRecord: false, 
    });

    this.logger.log(`Gerado JWT WebRTC (LiveKit) para Room: ${roomName}, Participante: ${participantIdentity}`);

    return await at.toJwt();
  }
}
