import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TutorEntity } from '../../database/entities/tutor.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { UpdateTutorDto } from './dto/update-tutor.dto';
import { latLngToCell } from 'h3-js';

@Injectable()
export class TutorsService {
  private readonly logger = new Logger(TutorsService.name);

  constructor(
    @InjectRepository(TutorEntity)
    private readonly tutorRepository: Repository<TutorEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  /**
   * Obtém o perfil do tutor ou autocria um perfil inicial para novos logins OTP
   */
  async getOrCreateProfile(userId: string, phoneNumber?: string): Promise<TutorEntity> {
    let tutor = await this.tutorRepository.findOne({
      where: { user_id: userId },
      relations: ['pets', 'subscriptions'],
    });

    if (!tutor) {
      this.logger.log(`Criando perfil base de Tutor para o usuário ${userId}`);
      tutor = this.tutorRepository.create({
        user_id: userId,
        full_name: phoneNumber ? `Tutor (${phoneNumber})` : 'Tutor PetPrev',
        address_street: 'Não informado',
        address_number: 'S/N',
        address_neighborhood: 'Bairro Padrão',
        address_city: 'Salvador',
        address_zipcode: '40000-000',
        h3_index_res8: '882a1072b5fffff',
      });
      tutor = await this.tutorRepository.save(tutor);
    }

    return tutor;
  }

  /**
   * Atualiza dados de endereço, nome e indexação espacial H3
   */
  async updateProfile(userId: string, dto: UpdateTutorDto): Promise<TutorEntity> {
    const tutor = await this.getOrCreateProfile(userId);

    if (dto.full_name !== undefined) tutor.full_name = dto.full_name;
    if (dto.address_street !== undefined) tutor.address_street = dto.address_street;
    if (dto.address_number !== undefined) tutor.address_number = dto.address_number;
    if (dto.address_neighborhood !== undefined) tutor.address_neighborhood = dto.address_neighborhood;
    if (dto.address_city !== undefined) tutor.address_city = dto.address_city;
    if (dto.address_zipcode !== undefined) tutor.address_zipcode = dto.address_zipcode;

    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      tutor.location = {
        type: 'Point',
        coordinates: [dto.longitude, dto.latitude],
      };
      try {
        tutor.h3_index_res8 = latLngToCell(dto.latitude, dto.longitude, 8);
      } catch (err) {
        this.logger.warn(`Erro ao calcular h3 index para lat/lng: ${err.message}`);
      }
    }

    return await this.tutorRepository.save(tutor);
  }
}
