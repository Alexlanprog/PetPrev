import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('clinical_protocol_versions')
export class ClinicalProtocolVersionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  version_name: string;

  @Column({ type: 'uuid' })
  approved_by_rt: string;

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'approved_by_rt' })
  approver_rt: UserEntity;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'jsonb' })
  rules_json: Record<string, any>[] | any;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;
}
