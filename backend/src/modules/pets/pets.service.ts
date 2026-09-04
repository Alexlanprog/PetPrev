import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PetEntity } from '../../database/entities/pet.entity';
import { TutorsService } from '../tutors/tutors.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';

@Injectable()
export class PetsService {
  private readonly logger = new Logger(PetsService.name);

  constructor(
    @InjectRepository(PetEntity)
    private readonly petRepository: Repository<PetEntity>,
    private readonly tutorsService: TutorsService,
  ) {}

  /**
   * Cria um novo pet vinculado ao tutor autenticado
   */
  async create(userId: string, dto: CreatePetDto): Promise<PetEntity> {
    const tutor = await this.tutorsService.getOrCreateProfile(userId);

    const pet = this.petRepository.create({
      tutor_id: tutor.id,
      name: dto.name,
      species: dto.species,
      breed: dto.breed || 'Sem raça definida',
      gender: dto.gender || 'U',
      birth_date: dto.birth_date || new Date().toISOString().split('T')[0],
      weight_kg: dto.weight_kg,
      photo_url: dto.photo_url,
      is_active: true,
    });

    const saved = await this.petRepository.save(pet);
    this.logger.log(`Novo pet cadastrado: ${saved.name} (ID: ${saved.id}) para tutor ${tutor.id}`);
    return saved;
  }

  /**
   * Lista todos os pets ativos do tutor logado
   */
  async findAllByTutor(userId: string): Promise<PetEntity[]> {
    const tutor = await this.tutorsService.getOrCreateProfile(userId);
    return await this.petRepository.find({
      where: { tutor_id: tutor.id, is_active: true },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Busca um pet específico por ID
   */
  async findOne(id: string): Promise<PetEntity> {
    const pet = await this.petRepository.findOne({
      where: { id },
      relations: ['tutor', 'medical_records', 'appointments'],
    });

    if (!pet) {
      throw new NotFoundException(`Pet com ID ${id} não encontrado.`);
    }

    return pet;
  }

  /**
   * Atualiza dados cadastrais do pet
   */
  async update(id: string, dto: UpdatePetDto): Promise<PetEntity> {
    const pet = await this.findOne(id);

    if (dto.name !== undefined) pet.name = dto.name;
    if (dto.species !== undefined) pet.species = dto.species;
    if (dto.breed !== undefined) pet.breed = dto.breed;
    if (dto.gender !== undefined) pet.gender = dto.gender;
    if (dto.birth_date !== undefined) pet.birth_date = dto.birth_date;
    if (dto.weight_kg !== undefined) pet.weight_kg = dto.weight_kg;
    if (dto.photo_url !== undefined) pet.photo_url = dto.photo_url;

    return await this.petRepository.save(pet);
  }
}
