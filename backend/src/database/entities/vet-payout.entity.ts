import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { VeterinarianEntity } from './veterinarian.entity';
import { AppointmentEntity } from './appointment.entity';

@Entity('vet_payouts')
@Index(['veterinarian_id', 'status'])
export class VetPayoutEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  veterinarian_id: string;

  @ManyToOne(() => VeterinarianEntity, (vet) => vet.payouts, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'veterinarian_id' })
  veterinarian: VeterinarianEntity;

  @Column({ type: 'uuid' })
  appointment_id: string;

  @ManyToOne(() => AppointmentEntity, (app) => app.payouts, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'appointment_id' })
  appointment: AppointmentEntity;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amount_consultation: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amount_km: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  total_payout: number;

  @Column({ type: 'varchar', length: 20, default: 'SCHEDULED' })
  status: string; // 'SCHEDULED', 'PAID', 'FAILED'

  @Column({ type: 'timestamp with time zone', nullable: true })
  paid_at?: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;
}
