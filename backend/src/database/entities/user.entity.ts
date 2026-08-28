import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserRole } from '../enums';
import { UserSessionEntity } from './user-session.entity';
import { AuditLogEntity } from './audit-log.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password_hash?: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  phone_number: string;

  @Column({ type: 'varchar', length: 14, unique: true })
  cpf: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.TUTOR,
  })
  role: UserRole;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  @OneToMany(() => UserSessionEntity, (session) => session.user)
  sessions: UserSessionEntity[];

  @OneToMany(() => AuditLogEntity, (log) => log.actor)
  audit_logs: AuditLogEntity[];
}
