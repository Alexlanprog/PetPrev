import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { AppointmentEntity } from './appointment.entity';
import { ColdChainAuditEntity } from './cold-chain-audit.entity';
import { MedicalRecordEntity } from './medical-record.entity';
import { VetPayoutEntity } from './vet-payout.entity';

@Entity('veterinarians')
@Index(['base_h3_index'])
export class VeterinarianEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @OneToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'varchar', length: 255 })
  full_name: string;

  @Column({ type: 'varchar', length: 20 })
  crmv_number: string;

  @Column({ type: 'varchar', length: 2 })
  crmv_uf: string;

  @Column({ type: 'varchar', length: 20, default: 'PENDING_APPROVAL' })
  approval_status: string;

  @Column({ type: 'uuid', nullable: true })
  approved_by_rt?: string;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'approved_by_rt' })
  approver?: UserEntity;

  @Column({ type: 'varchar', length: 100 })
  pix_key: string;

  @Column({ type: 'numeric', precision: 3, scale: 2, default: 5.0 })
  rating_average: number;

  @Column({ type: 'text', nullable: true })
  public_key_pem?: string;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  base_location?: any;

  @Column({ type: 'varchar', length: 15, nullable: true })
  base_h3_index?: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @OneToMany(() => AppointmentEntity, (appointment) => appointment.veterinarian)
  appointments: AppointmentEntity[];

  @OneToMany(() => ColdChainAuditEntity, (audit) => audit.veterinarian)
  cold_chain_audits: ColdChainAuditEntity[];

  @OneToMany(() => MedicalRecordEntity, (record) => record.veterinarian)
  medical_records: MedicalRecordEntity[];

  @OneToMany(() => VetPayoutEntity, (payout) => payout.veterinarian)
  payouts: VetPayoutEntity[];
}
