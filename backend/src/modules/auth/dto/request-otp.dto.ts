import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class RequestOtpDto {
  @IsNotEmpty({ message: 'O número de telefone é obrigatório.' })
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message:
      'O número de telefone deve estar no formato E.164 internacional (Ex: +5511999998888).',
  })
  phone_number: string;
}
