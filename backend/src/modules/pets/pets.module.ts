import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PetsController } from './pets.controller';
import { PetsService } from './pets.service';
import { PetEntity } from '../../database/entities/pet.entity';
import { TutorsModule } from '../tutors/tutors.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PetEntity]),
    TutorsModule,
  ],
  controllers: [PetsController],
  providers: [PetsService],
  exports: [PetsService],
})
export class PetsModule {}
