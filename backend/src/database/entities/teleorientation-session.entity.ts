import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TutorEntity } from './tutor.entity';
import { VeterinarianEntity } from './veterinarian.entity';

@Entity('teleorientation_sessions')
export class TeleorientationSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tutor_id: string;

  @ManyToOne(() => TutorEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tutor_id' })
  tutor: TutorEntity;

  @Column({ type: 'uuid' })
  veterinarian_id: string;

  @ManyToOne(() => VeterinarianEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'veterinarian_id' })
  veterinarian: VeterinarianEntity;

  @Column({ type: 'varchar', length: 100 })
  room_name: string;

  @Column({ type: 'boolean', default: false })
  is_recording_enabled: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  started_at: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  ended_at?: Date;
}
