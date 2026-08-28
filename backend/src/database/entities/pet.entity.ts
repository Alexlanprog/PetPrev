import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { PetSpecies } from '../enums';
import { TutorEntity } from './tutor.entity';
import { AppointmentEntity } from './appointment.entity';
import { MedicalRecordEntity } from './medical-record.entity';

@Entity('pets')
export class PetEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tutor_id: string;

  @ManyToOne(() => TutorEntity, (tutor) => tutor.pets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tutor_id' })
  tutor: TutorEntity;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({
    type: 'enum',
    enum: PetSpecies,
  })
  species: PetSpecies;

  @Column({ type: 'varchar', length: 100 })
  breed: string;

  @Column({ type: 'varchar', length: 10 })
  gender: string;

  @Column({ type: 'date' })
  birth_date: Date | string;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  weight_kg?: number;

  @Column({ type: 'text', nullable: true })
  photo_url?: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @OneToMany(() => AppointmentEntity, (appointment) => appointment.pet)
  appointments: AppointmentEntity[];

  @OneToMany(() => MedicalRecordEntity, (record) => record.pet)
  medical_records: MedicalRecordEntity[];
}
