import { Module, Get } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './modules/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClinicalModule } from './modules/clinical/clinical.module';
import { StorageModule } from './modules/storage/storage.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { MedicalRecordsModule } from './modules/medical-records/medical-records.module';
import { BillingModule } from './modules/billing/billing.module';
import { CommunicationsModule } from './modules/communications/communications.module';
import { PetsModule } from './modules/pets/pets.module';
import { TutorsModule } from './modules/tutors/tutors.module';
import { DevModule } from './modules/dev/dev.module';
import { BullModule } from '@nestjs/bullmq';

import { validateEnvironment } from './config/env.validation';
import * as client from 'prom-client';

// Coleta métricas padrão do Node.js / V8 (processo, heap, event loop, GC)
client.collectDefaultMetrics({ prefix: 'petprev_' });

@Controller()
export class AppController {
  @Get('healthz')
  getHealth() {
    return {
      status: 'UP',
      service: 'petprev-backend',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  @Get('metrics')
  async getMetrics() {
    return await client.register.metrics();
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    DatabaseModule,
    RedisModule,
    AuthModule,
    ClinicalModule,
    StorageModule,
    AppointmentsModule,
    MedicalRecordsModule,
    BillingModule,
    CommunicationsModule,
    PetsModule,
    TutorsModule,
    ...(process.env.NODE_ENV !== 'production' ? [DevModule] : []),
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule { }
