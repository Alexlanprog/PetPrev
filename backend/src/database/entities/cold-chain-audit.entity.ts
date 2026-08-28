import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AppointmentEntity } from './appointment.entity';
import { VeterinarianEntity } from './veterinarian.entity';

@Entity('cold_chain_audits')
export class ColdChainAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  appointment_id: string;

  @ManyToOne(() => AppointmentEntity, (appointment) => appointment.cold_chain_audits, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'appointment_id' })
  appointment: AppointmentEntity;

  @Column({ type: 'uuid' })
  veterinarian_id: string;

  @ManyToOne(() => VeterinarianEntity, (vet) => vet.cold_chain_audits, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'veterinarian_id' })
  veterinarian: VeterinarianEntity;

  @Column({ type: 'numeric', precision: 4, scale: 1 })
  temperature_celsius: number;

  @Column({ type: 'text' })
  proof_photo_url: string;

  @Column({ type: 'varchar', length: 20 })
  validation_status: string; // 'VALID' ou 'BLOCKED_OUT_OF_RANGE'

  @CreateDateColumn({ type: 'timestamp with time zone' })
  recorded_at: Date;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  gps_location: any;
}
