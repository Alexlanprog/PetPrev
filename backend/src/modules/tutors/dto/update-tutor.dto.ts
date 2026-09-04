import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateTutorDto {
  @IsOptional()
  @IsString()
  full_name?: string;

  @IsOptional()
  @IsString()
  address_street?: string;

  @IsOptional()
  @IsString()
  address_number?: string;

  @IsOptional()
  @IsString()
  address_neighborhood?: string;

  @IsOptional()
  @IsString()
  address_city?: string;

  @IsOptional()
  @IsString()
  address_zipcode?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}
