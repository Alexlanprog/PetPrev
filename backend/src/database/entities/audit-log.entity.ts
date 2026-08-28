import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('audit_logs')
@Index(['actor_id'])
@Index(['entity_name', 'entity_id'])
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  actor_id?: string;

  @ManyToOne(() => UserEntity, (user) => user.audit_logs, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'actor_id' })
  actor?: UserEntity;

  @Column({ type: 'varchar', length: 100 })
  action: string;

  @Column({ type: 'varchar', length: 100 })
  entity_name: string;

  @Column({ type: 'uuid' })
  entity_id: string;

  @Column({ type: 'varchar', length: 45 })
  ip_address: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  device_id?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata_json?: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;
}
