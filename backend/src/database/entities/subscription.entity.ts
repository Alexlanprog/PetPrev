import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SubscriptionStatus } from '../enums';
import { TutorEntity } from './tutor.entity';

@Entity('subscriptions')
export class SubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tutor_id: string;

  @ManyToOne(() => TutorEntity, (tutor) => tutor.subscriptions, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'tutor_id' })
  tutor: TutorEntity;

  @Column({ type: 'varchar', length: 50 })
  plan_type: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  monthly_price: number;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  gateway_subscription_id?: string;

  @Column({ type: 'date' })
  current_period_start: Date | string;

  @Column({ type: 'date' })
  current_period_end: Date | string;

  @Column({ type: 'date' })
  loyalty_end_date: Date | string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;
}
