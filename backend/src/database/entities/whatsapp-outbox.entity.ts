import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('whatsapp_outbox')
@Index(['status'])
export class WhatsAppOutboxEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  phone_to: string;

  @Column({ type: 'text' })
  message_text: string;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status: string; // 'PENDING', 'SENT', 'FAILED'

  @Column({ type: 'int', default: 0 })
  retry_count: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;
}
