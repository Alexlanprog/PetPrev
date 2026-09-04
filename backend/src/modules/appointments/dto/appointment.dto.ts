import { IsUUID, IsDateString, IsString, IsEnum } from 'class-validator';
import { AppointmentStatus } from '../../../database/enums';

export class CreateAppointmentDto {
  @IsUUID()
  pet_id: string;

  @IsDateString()
  scheduled_date: string;

  @IsString()
  time_window_start: string;

  @IsString()
  time_window_end: string;
}

export class UpdateAppointmentStatusDto {
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;
}
