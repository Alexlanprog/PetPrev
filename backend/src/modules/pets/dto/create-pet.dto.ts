import { IsString, IsEnum, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { PetSpecies } from '../../../database/enums';

export class CreatePetDto {
  @IsString()
  name: string;

  @IsEnum(PetSpecies)
  species: PetSpecies;

  @IsOptional()
  @IsString()
  breed?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsDateString()
  birth_date?: string;

  @IsOptional()
  @IsNumber()
  weight_kg?: number;

  @IsOptional()
  @IsString()
  photo_url?: string;
}
