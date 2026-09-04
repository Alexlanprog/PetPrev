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
  getMetrics() {
    return '# HELP process_cpu_seconds_total Total user and system CPU time spent in seconds.\n# TYPE process_cpu_seconds_total counter\nprocess_cpu_seconds_total 0.1\n';
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
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
    DevModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
