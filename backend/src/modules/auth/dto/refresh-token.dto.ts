import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class RefreshTokenDto {
  @IsNotEmpty({ message: 'O refresh_token é obrigatório.' })
  @IsString()
  refresh_token: string;

  @IsOptional()
  @IsString()
  device_info?: string;
}
