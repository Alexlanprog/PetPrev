import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppointmentEntity } from '../../../database/entities/appointment.entity';
import { VetPayoutEntity } from '../../../database/entities/vet-payout.entity';
import { AppointmentStatus } from '../../../database/enums';

@Injectable()
export class VetPayoutEngineService {
  private readonly logger = new Logger(VetPayoutEngineService.name);

  // Valores fixos da modelagem do negócio
  private readonly BASE_PAYOUT_AMOUNT = 65.00;
  private readonly KM_RATE = 1.50;

  constructor(
    @InjectRepository(AppointmentEntity)
    private readonly appointmentRepository: Repository<AppointmentEntity>,
    @InjectRepository(VetPayoutEntity)
    private readonly vetPayoutRepository: Repository<VetPayoutEntity>,
  ) {}

  /**
   * Calcula e agenda o repasse para o veterinário após a conclusão de uma consulta aprovada.
   * O cálculo de distância utiliza a coluna `distance_km_audited` da tabela appointments.
   */
  async calculateAndSchedulePayout(appointmentId: string): Promise<VetPayoutEntity | null> {
    const appointment = await this.appointmentRepository.findOne({ where: { id: appointmentId } });

    if (!appointment) {
      this.logger.error(`Agendamento não encontrado para o ID: ${appointmentId}`);
      return null;
    }

    if (appointment.status !== AppointmentStatus.COMPLETED) {
      this.logger.warn(`Tentativa de gerar Payout para agendamento não completado: ${appointmentId}`);
      return null;
    }

    // Pega a distância. Caso seja nula, consideramos 0 para evitar quebrar o cálculo.
    const distanceKm = appointment.distance_km_audited || 0;

    // Fórmula: R$ 65,00 + (distance_km_audited * R$ 1,50)
    const totalAmount = this.BASE_PAYOUT_AMOUNT + (distanceKm * this.KM_RATE);

    // Cria o registro na tabela de repasses
    const payout = this.vetPayoutRepository.create({
      veterinarian_id: appointment.veterinarian_id,
      appointment_id: appointment.id,
      amount_consultation: this.BASE_PAYOUT_AMOUNT,
      amount_km: distanceKm * this.KM_RATE,
      total_payout: totalAmount,
      status: 'SCHEDULED',
      // O payout_date pode ser preenchido futuramente por um job que agenda o PIX
    });

    const savedPayout = await this.vetPayoutRepository.save(payout);
    
    this.logger.log(`Payout de R$ ${totalAmount.toFixed(2)} agendado para o vet ${appointment.veterinarian_id} (Agendamento: ${appointment.id}). Distância: ${distanceKm}km`);
    
    return savedPayout;
  }
}
