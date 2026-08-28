import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { PetEntity } from './pet.entity';
import { SubscriptionEntity } from './subscription.entity';
import { AppointmentEntity } from './appointment.entity';

@Entity('tutors')
@Index(['h3_index_res8'])
export class TutorEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @OneToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'varchar', length: 255 })
  full_name: string;

  @Column({ type: 'varchar', length: 255 })
  address_street: string;

  @Column({ type: 'varchar', length: 20 })
  address_number: string;

  @Column({ type: 'varchar', length: 100 })
  address_neighborhood: string;

  @Column({ type: 'varchar', length: 100 })
  address_city: string;

  @Column({ type: 'varchar', length: 10 })
  address_zipcode: string;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  location?: any;

  @Column({ type: 'varchar', length: 15, nullable: true })
  h3_index_res8?: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @OneToMany(() => PetEntity, (pet) => pet.tutor)
  pets: PetEntity[];

  @OneToMany(() => SubscriptionEntity, (sub) => sub.tutor)
  subscriptions: SubscriptionEntity[];

  @OneToMany(() => AppointmentEntity, (appointment) => appointment.tutor)
  appointments: AppointmentEntity[];
}
