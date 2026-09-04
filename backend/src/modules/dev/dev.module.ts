import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { DevController } from './dev.controller';
import { DevService } from './dev.service';
import { UserEntity } from '../../database/entities/user.entity';
import { TutorEntity } from '../../database/entities/tutor.entity';
import { VeterinarianEntity } from '../../database/entities/veterinarian.entity';
import { PetEntity } from '../../database/entities/pet.entity';
import { AppointmentEntity } from '../../database/entities/appointment.entity';
import { MedicalRecordEntity } from '../../database/entities/medical-record.entity';
import { SubscriptionEntity } from '../../database/entities/subscription.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      TutorEntity,
      VeterinarianEntity,
      PetEntity,
      AppointmentEntity,
      MedicalRecordEntity,
      SubscriptionEntity,
    ]),
    JwtModule.register({}),
  ],
  controllers: [DevController],
  providers: [DevService],
  exports: [DevService],
})
export class DevModule {}
