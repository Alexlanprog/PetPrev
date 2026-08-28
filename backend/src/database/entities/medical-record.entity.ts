import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AppointmentEntity } from './appointment.entity';
import { PetEntity } from './pet.entity';
import { VeterinarianEntity } from './veterinarian.entity';

@Entity('medical_records')
@Index(['appointment_id'])
@Index(['pet_id'])
@Index(['veterinarian_id'])
export class MedicalRecordEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  appointment_id: string;

  @ManyToOne(() => AppointmentEntity, (appointment) => appointment.medical_records, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'appointment_id' })
  appointment: AppointmentEntity;

  @Column({ type: 'uuid' })
  pet_id: string;

  @ManyToOne(() => PetEntity, (pet) => pet.medical_records, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'pet_id' })
  pet: PetEntity;

  @Column({ type: 'uuid' })
  veterinarian_id: string;

  @ManyToOne(() => VeterinarianEntity, (vet) => vet.medical_records, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'veterinarian_id' })
  veterinarian: VeterinarianEntity;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'boolean', default: false })
  has_conflict: boolean;

  @Column({ type: 'numeric', precision: 5, scale: 2 })
  weight_recorded: number;

  @Column({ type: 'numeric', precision: 4, scale: 1 })
  temperature_body: number;

  @Column({ type: 'text' })
  clinical_notes: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  vaccine_lot_applied?: string;

  // Assinatura Digital Assimétrica do Veterinário (ECDSA SHA-256)
  @Column({ type: 'varchar', length: 64 })
  payload_hash_sha256: string;

  @Column({ type: 'text' })
  vet_digital_signature_base64: string;

  @Column({ type: 'timestamp with time zone' })
  vet_signed_at: Date;

  // Aceite & Evidência Legal do Tutor
  @Column({ type: 'timestamp with time zone' })
  tutor_consent_timestamp: Date;

  @Column({ type: 'varchar', length: 45 })
  tutor_consent_ip: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  tutor_consent_device_id?: string;

  @Column({ type: 'text', nullable: true })
  tutor_consent_signature_image_url?: string;

  @Column({ type: 'varchar', length: 50 })
  tutor_consent_document_version: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;
}
