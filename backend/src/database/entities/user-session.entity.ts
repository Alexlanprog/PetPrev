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

@Entity('user_sessions')
@Index(['user_id', 'is_revoked'])
export class UserSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => UserEntity, (user) => user.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'varchar', length: 255 })
  refresh_token_hash: string;

  @Column({ type: 'varchar', length: 255 })
  device_info: string;

  @Column({ type: 'varchar', length: 45 })
  ip_address: string;

  @Column({ type: 'boolean', default: false })
  is_revoked: boolean;

  @Column({ type: 'timestamp with time zone' })
  expires_at: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;
}
