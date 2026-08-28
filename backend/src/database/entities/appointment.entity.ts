import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { AppointmentStatus } from '../enums';
import { TutorEntity } from './tutor.entity';
import { PetEntity } from './pet.entity';
import { VeterinarianEntity } from './veterinarian.entity';
import { ColdChainAuditEntity } from './cold-chain-audit.entity';
import { MedicalRecordEntity } from './medical-record.entity';
import { VetPayoutEntity } from './vet-payout.entity';

@Entity('appointments')
@Index(['scheduled_date', 'status'])
@Index(['tutor_id', 'pet_id'])
export class AppointmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tutor_id: string;

  @ManyToOne(() => TutorEntity, (tutor) => tutor.appointments, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'tutor_id' })
  tutor: TutorEntity;

  @Column({ type: 'uuid' })
  pet_id: string;

  @ManyToOne(() => PetEntity, (pet) => pet.appointments, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'pet_id' })
  pet: PetEntity;

  @Column({ type: 'uuid', nullable: true })
  veterinarian_id?: string;

  @ManyToOne(() => VeterinarianEntity, (vet) => vet.appointments, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'veterinarian_id' })
  veterinarian?: VeterinarianEntity;

  @Column({ type: 'date' })
  scheduled_date: Date | string;

  @Column({ type: 'time' })
  time_window_start: string;

  @Column({ type: 'time' })
  time_window_end: string;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.REQUESTED,
  })
  status: AppointmentStatus;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  distance_km_audited?: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  payout_vet_amount?: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @OneToMany(() => ColdChainAuditEntity, (audit) => audit.appointment)
  cold_chain_audits: ColdChainAuditEntity[];

  @OneToMany(() => MedicalRecordEntity, (record) => record.appointment)
  medical_records: MedicalRecordEntity[];

  @OneToMany(() => VetPayoutEntity, (payout) => payout.appointment)
  payouts: VetPayoutEntity[];
}
