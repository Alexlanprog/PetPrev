import {
  Injectable,
  Logger,
  UnprocessableEntityException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  BadGatewayException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { MedicalRecordEntity } from '../../../database/entities/medical-record.entity';
import { VeterinarianEntity } from '../../../database/entities/veterinarian.entity';
import { PetEntity } from '../../../database/entities/pet.entity';
import { AppointmentEntity } from '../../../database/entities/appointment.entity';
import { UserRole, AppointmentStatus } from '../../../database/enums';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { CryptoService } from './crypto.service';
import { StorageService } from '../../storage/storage.service';

export interface CreateMedicalRecordDto {
  appointment_id: string;
  pet_id: string;
  weight_recorded: number;
  temperature_body: number;
  clinical_notes: string;
  applied_vaccines?: string[];
  signature_ecdsa: string; // Assinatura do Payload
  payload_signed: string;  // O JSON stringificado que foi assinado no mobile
  // Metadados do Tutor
  tutor_consent_timestamp: Date | string;
  tutor_consent_ip: string;
  tutor_consent_document_version: string;
}

@Injectable()
export class MedicalRecordsService {
  private readonly logger = new Logger(MedicalRecordsService.name);

  constructor(
    @InjectRepository(MedicalRecordEntity)
    private readonly medicalRecordRepository: Repository<MedicalRecordEntity>,
    @InjectRepository(VeterinarianEntity)
    private readonly veterinarianRepository: Repository<VeterinarianEntity>,
    @InjectRepository(PetEntity)
    private readonly petRepository: Repository<PetEntity>,
    @InjectRepository(AppointmentEntity)
    private readonly appointmentRepository: Repository<AppointmentEntity>,
    private readonly cryptoService: CryptoService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Grava o prontuário exigindo validação da assinatura ECDSA do Veterinário.
   * Em ambiente de desenvolvimento, aceita assinaturas mockadas para viabilizar testes pontuais.
   */
  async createSignedRecord(
    vetUserId: string,
    dto: CreateMedicalRecordDto,
    tutorSignatureFile?: any,
  ): Promise<MedicalRecordEntity> {
    const isProduction = process.env.NODE_ENV === 'production';
    const isDev = !isProduction;

    // 1. Obter veterinário vinculado ao usuário
    let vet = await this.veterinarianRepository.findOne({ where: { user_id: vetUserId } });

    // Em modo dev, cria ou usa perfil de veterinário padrão caso não exista
    if (!vet && isDev) {
      this.logger.warn(`Modo desenvolvimento: criando VeterinarianEntity temporário para user ${vetUserId}`);
      vet = this.veterinarianRepository.create({
        user_id: vetUserId,
        full_name: 'Dr. Veterinário de Campo',
        crmv_number: '12345',
        crmv_uf: 'BA',
        pix_key: 'vet@petprev.com.br',
        approval_status: 'APPROVED',
      });
      vet = await this.veterinarianRepository.save(vet);
    }

    if (!vet) {
      throw new BadRequestException('Perfil de veterinário não encontrado para o usuário.');
    }

    // 2. Validar Assinatura Digital ECDSA (com bypass controlado exclusivamente em ambiente de desenvolvimento)
    const isMockSig = dto.signature_ecdsa?.startsWith('MOCK_');

    if (isProduction && isMockSig) {
      throw new UnprocessableEntityException(
        'Assinaturas simuladas (MOCK) não são aceitas em ambiente de produção.',
      );
    }

    const shouldValidateReal = isProduction || !isMockSig;
    if (shouldValidateReal) {
      if (!vet.public_key_pem) {
        throw new BadRequestException('Veterinário não possui chave pública cadastrada para assinatura.');
      }

      const isSignatureValid = this.cryptoService.verifyEcdsaSignature(
        dto.payload_signed,
        dto.signature_ecdsa,
        vet.public_key_pem,
      );

      if (!isSignatureValid) {
        throw new UnprocessableEntityException('Assinatura digital do prontuário é inválida ou o payload foi adulterado.');
      }
    } else {
      this.logger.warn(`Modo desenvolvimento: validação ECDSA aprovada via assinatura simulada (${dto.signature_ecdsa}).`);
    }

    // 3. Upload da assinatura do tutor para o MinIO (se fornecida)
    let tutorSignatureUrl: string | null = null;
    if (tutorSignatureFile) {
      try {
        tutorSignatureUrl = await this.storageService.uploadFile(
          'petprev-records',
          tutorSignatureFile.originalname || 'assinatura.png',
          tutorSignatureFile.buffer,
          tutorSignatureFile.mimetype || 'image/png',
        );
      } catch (err) {
        this.logger.error(`Falha no upload da assinatura para o storage MinIO: ${err.message}`);
        throw new BadGatewayException('Falha ao salvar assinatura do tutor. Tente novamente.');
      }
    }

    // 4. Gerar hash de integridade do payload
    const dataHash = this.cryptoService.generateHash(dto.payload_signed);

    // 5. Salvar o prontuário
    const record = this.medicalRecordRepository.create({
      appointment_id: dto.appointment_id,
      pet_id: dto.pet_id,
      veterinarian_id: vet.id,
      weight_recorded: dto.weight_recorded,
      temperature_body: dto.temperature_body,
      clinical_notes: dto.clinical_notes,
      vaccine_lot_applied: Array.isArray(dto.applied_vaccines) ? dto.applied_vaccines.join(', ') : (dto.applied_vaccines || null),
      payload_hash_sha256: dataHash,
      vet_digital_signature_base64: dto.signature_ecdsa,
      vet_signed_at: new Date(),
      tutor_consent_timestamp: new Date(dto.tutor_consent_timestamp || Date.now()),
      tutor_consent_ip: dto.tutor_consent_ip || '127.0.0.1',
      tutor_consent_document_version: dto.tutor_consent_document_version || 'v1.0',
      tutor_consent_signature_image_url: tutorSignatureUrl,
      version: 1,
      has_conflict: false,
    });

    try {
      const savedRecord = await this.medicalRecordRepository.save(record);
      this.logger.log(`Prontuário assinado salvo com sucesso. ID: ${savedRecord.id}`);
      return savedRecord;
    } catch (error) {
      this.logger.error(`Erro ao salvar prontuário assinado: ${error.message}`);
      throw new BadRequestException('Falha na persistência do prontuário. Verifique os dados enviados.');
    }
  }

  /**
   * Retorna os prontuários de um determinado pet para exibição na carteirinha digital,
   * aplicando controle de acesso estrito para prevenção de IDOR.
   */
  async findByPetId(petId: string, user?: CurrentUserPayload): Promise<MedicalRecordEntity[]> {
    const pet = await this.petRepository.findOne({
      where: { id: petId },
      relations: ['tutor'],
    });

    if (!pet) {
      throw new NotFoundException('Pet não encontrado.');
    }

    if (user) {
      // Prevenção de IDOR por papel de usuário
      if (user.role === UserRole.TUTOR) {
        if (!pet.tutor || pet.tutor.user_id !== user.userId) {
          throw new ForbiddenException(
            'Acesso negado: Você não possui permissão para visualizar o prontuário deste pet.',
          );
        }
      } else if (user.role === UserRole.VET_FIELD) {
        const vet = await this.veterinarianRepository.findOne({ where: { user_id: user.userId } });
        if (!vet) {
          throw new ForbiddenException('Acesso negado: Perfil de veterinário não encontrado.');
        }

        // Decisão de Arquitetura confirmada (PLANO_1_SEGURANCA_atualizado.md - Item 4):
        // VET_FIELD possui acesso estritamente se existir agendamento confirmado, a caminho,
        // em andamento ou concluído para este pet. Status CANCELADO, FAILED_ABSENT ou REQUESTED
        // não concedem permissão de acesso ao histórico clínico por sigilo e conformidade LGPD.
        const hasValidAppointment = await this.appointmentRepository.findOne({
          where: {
            pet_id: petId,
            veterinarian_id: vet.id,
            status: In([
              AppointmentStatus.ROUTE_ASSIGNED,
              AppointmentStatus.EN_ROUTE,
              AppointmentStatus.IN_PROGRESS,
              AppointmentStatus.COMPLETED,
            ]),
          },
        });

        if (!hasValidAppointment) {
          throw new ForbiddenException(
            'Acesso negado: Veterinário de campo não possui agendamento confirmado ou concluído vinculado a este pet.',
          );
        }
      }
      // VET_RESPONSAVEL_TECNICO e ADMIN_GERAL possuem acesso irrestrito para supervisão clínica e auditoria
    }

    return await this.medicalRecordRepository.find({
      where: { pet_id: petId },
      relations: ['veterinarian', 'appointment'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Retorna prontuários para o painel de auditoria do RT (com filtro de conflito)
   */
  async findAll(filters: { has_conflict?: boolean; limit?: number; offset?: number }): Promise<MedicalRecordEntity[]> {
    const query = this.medicalRecordRepository
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.pet', 'pet')
      .leftJoinAndSelect('pet.tutor', 'tutor')
      .leftJoinAndSelect('record.veterinarian', 'veterinarian')
      .leftJoinAndSelect('record.appointment', 'appointment');

    if (filters.has_conflict !== undefined) {
      query.andWhere('record.has_conflict = :hasConflict', { hasConflict: filters.has_conflict });
    }

    query.orderBy('record.created_at', 'DESC');

    if (filters.limit) query.take(filters.limit);
    if (filters.offset) query.skip(filters.offset);

    return await query.getMany();
  }
}
