import { Injectable, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppointmentEntity } from '../../../database/entities/appointment.entity';
import { TutorEntity } from '../../../database/entities/tutor.entity';
import { VeterinarianEntity } from '../../../database/entities/veterinarian.entity';
import { AppointmentStatus, UserRole } from '../../../database/enums';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { CreateAppointmentDto } from '../dto/appointment.dto';
import { VetPayoutEngineService } from '../../billing/services/vet-payout-engine.service';
import { TutorsService } from '../../tutors/tutors.service';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    @InjectRepository(AppointmentEntity)
    private readonly appointmentRepository: Repository<AppointmentEntity>,
    @InjectRepository(TutorEntity)
    private readonly tutorRepository: Repository<TutorEntity>,
    @InjectRepository(VeterinarianEntity)
    private readonly veterinarianRepository: Repository<VeterinarianEntity>,
    private readonly tutorsService: TutorsService,
    @Inject(forwardRef(() => VetPayoutEngineService))
    private readonly vetPayoutEngineService: VetPayoutEngineService,
  ) {}

  /**
   * Solicita um novo agendamento de visita domiciliar
   */
  async createAppointment(userId: string, dto: CreateAppointmentDto): Promise<AppointmentEntity> {
    const tutor = await this.tutorsService.getOrCreateProfile(userId);

    const appointment = this.appointmentRepository.create({
      tutor_id: tutor.id,
      pet_id: dto.pet_id,
      scheduled_date: dto.scheduled_date,
      time_window_start: dto.time_window_start,
      time_window_end: dto.time_window_end,
      status: AppointmentStatus.REQUESTED,
    });

    const saved = await this.appointmentRepository.save(appointment);
    this.logger.log(`Novo agendamento criado: ID ${saved.id} para o pet ${dto.pet_id}`);
    return saved;
  }

  /**
   * Lista agendamentos conforme o papel do usuário (Tutor, Veterinário ou Admin)
   */
  async findAppointments(
    user: CurrentUserPayload,
    filters?: { status?: AppointmentStatus; date?: string; pet_id?: string },
  ): Promise<AppointmentEntity[]> {
    const query = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.pet', 'pet')
      .leftJoinAndSelect('appointment.tutor', 'tutor')
      .leftJoinAndSelect('appointment.veterinarian', 'veterinarian')
      .leftJoinAndSelect('appointment.cold_chain_audits', 'cold_chain_audits');

    if (user.role === UserRole.TUTOR) {
      const tutor = await this.tutorsService.getOrCreateProfile(user.userId);
      query.andWhere('appointment.tutor_id = :tutorId', { tutorId: tutor.id });
    } else if (user.role === UserRole.VET_FIELD) {
      const vet = await this.veterinarianRepository.findOne({ where: { user_id: user.userId } });
      if (vet) {
        query.andWhere(
          '(appointment.veterinarian_id = :vetId OR (appointment.veterinarian_id IS NULL AND appointment.status = :reqStatus))',
          { vetId: vet.id, reqStatus: AppointmentStatus.REQUESTED },
        );
      }
    }

    if (filters?.status) {
      query.andWhere('appointment.status = :status', { status: filters.status });
    }

    if (filters?.date) {
      query.andWhere('appointment.scheduled_date = :date', { date: filters.date });
    }

    if (filters?.pet_id) {
      query.andWhere('appointment.pet_id = :petId', { petId: filters.pet_id });
    }

    query.orderBy('appointment.scheduled_date', 'DESC');
    return await query.getMany();
  }

  /**
   * Atualiza status do agendamento (a caminho, iniciado, concluído, cancelado)
   */
  async updateStatus(
    appointmentId: string,
    newStatus: AppointmentStatus,
    user: CurrentUserPayload,
  ): Promise<AppointmentEntity> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
      relations: ['veterinarian'],
    });

    if (!appointment) {
      throw new NotFoundException(`Agendamento ${appointmentId} não encontrado.`);
    }

    const previousStatus = appointment.status;
    appointment.status = newStatus;

    // Se o veterinário de campo está assumindo ou mudando de status, vincula se necessário
    if (user.role === UserRole.VET_FIELD && !appointment.veterinarian_id) {
      const vet = await this.veterinarianRepository.findOne({ where: { user_id: user.userId } });
      if (vet) {
        appointment.veterinarian_id = vet.id;
      }
    }

    const saved = await this.appointmentRepository.save(appointment);
    this.logger.log(`Agendamento ${appointmentId} alterado de ${previousStatus} para ${newStatus}`);

    // Se concluído, dispara o cálculo de repasse financeiro do veterinário
    if (newStatus === AppointmentStatus.COMPLETED) {
      try {
        await this.vetPayoutEngineService.calculateAndSchedulePayout(appointmentId);
        this.logger.log(`Repasse calculado com sucesso para o agendamento ${appointmentId}`);
      } catch (err) {
        this.logger.error(`Erro ao acionar cálculo de repasse: ${err.message}`);
      }
    }

    return saved;
  }
}
