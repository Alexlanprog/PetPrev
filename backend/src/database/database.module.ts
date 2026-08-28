import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  UserEntity,
  UserSessionEntity,
  AuditLogEntity,
  TutorEntity,
  PetEntity,
  VeterinarianEntity,
  ClinicalProtocolVersionEntity,
  SubscriptionEntity,
  AppointmentEntity,
  ColdChainAuditEntity,
  MedicalRecordEntity,
  TeleorientationSessionEntity,
  WhatsAppOutboxEntity,
  VetPayoutEntity,
} from './entities';

const entities = [
  UserEntity,
  UserSessionEntity,
  AuditLogEntity,
  TutorEntity,
  PetEntity,
  VeterinarianEntity,
  ClinicalProtocolVersionEntity,
  SubscriptionEntity,
  AppointmentEntity,
  ColdChainAuditEntity,
  MedicalRecordEntity,
  TeleorientationSessionEntity,
  WhatsAppOutboxEntity,
  VetPayoutEntity,
];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
        username: process.env.POSTGRES_USER || 'petprev_admin',
        password: process.env.POSTGRES_PASSWORD || 'petprev_super_secret_db_pass_change_me',
        database: process.env.POSTGRES_DB || 'petprev_db',
        entities: entities,
        synchronize: false, // Usar sempre migrations em produção para integridade e preservação de triggers
        logging: process.env.NODE_ENV === 'development',
      }),
    }),
    TypeOrmModule.forFeature(entities),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
