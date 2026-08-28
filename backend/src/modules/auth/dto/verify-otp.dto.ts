import { IsNotEmpty, IsString, Length, Matches, IsOptional } from 'class-validator';

export class VerifyOtpDto {
  @IsNotEmpty({ message: 'O número de telefone é obrigatório.' })
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message:
      'O número de telefone deve estar no formato E.164 internacional (Ex: +5511999998888).',
  })
  phone_number: string;

  @IsNotEmpty({ message: 'O código OTP de 6 dígitos é obrigatório.' })
  @IsString()
  @Length(6, 6, { message: 'O código OTP deve possuir exatamente 6 dígitos.' })
  @Matches(/^\d{6}$/, { message: 'O código OTP deve conter apenas dígitos numéricos.' })
  code: string;

  @IsOptional()
  @IsString()
  device_info?: string;
}
