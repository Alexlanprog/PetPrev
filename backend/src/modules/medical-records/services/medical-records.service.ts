import { Injectable, Logger, UnprocessableEntityException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalRecordEntity } from '../../../database/entities/medical-record.entity';
import { VeterinarianEntity } from '../../../database/entities/veterinarian.entity';
import { CryptoService } from './crypto.service';
import { StorageService } from '../../storage/storage.service';

export interface CreateMedicalRecordDto {
  appointment_id: string;
  pet_id: string;
  weight_recorded: number;
  temperature_body: number;
  clinical_notes: string;
  applied_vaccines: string[];
  signature_ecdsa: string; // Assinatura do Payload
  payload_signed: string;  // O JSON stringificado que foi assinado no mobile
  // Metadados do Tutor
  tutor_consent_timestamp: Date;
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
    private readonly cryptoService: CryptoService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Grava o prontuário exigindo validação da assinatura ECDSA do Veterinário.
   */
  async createSignedRecord(
    vetId: string,
    dto: CreateMedicalRecordDto,
    tutorSignatureFile?: any,
  ): Promise<MedicalRecordEntity> {
    // 1. Obter a chave pública do veterinário
    const vet = await this.veterinarianRepository.findOne({ where: { user_id: vetId } });
    if (!vet || !vet.public_key_pem) {
      throw new BadRequestException('Veterinário não possui chave pública cadastrada para assinatura.');
    }

    // 2. Validar Assinatura Digital ECDSA
    const isSignatureValid = this.cryptoService.verifyEcdsaSignature(
      dto.payload_signed,
      dto.signature_ecdsa,
      vet.public_key_pem,
    );

    if (!isSignatureValid) {
      throw new UnprocessableEntityException('Assinatura digital do prontuário é inválida ou o payload foi adulterado.');
    }

    // 3. Upload da assinatura do tutor para o MinIO (se fornecida)
    let tutorSignatureUrl = null;
    if (tutorSignatureFile) {
      tutorSignatureUrl = await this.storageService.uploadFile(
        'petprev-records',
        tutorSignatureFile.originalname,
        tutorSignatureFile.buffer,
        tutorSignatureFile.mimetype,
      );
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
      vaccine_lot_applied: dto.applied_vaccines?.join(', '),
      payload_hash_sha256: dataHash,
      vet_digital_signature_base64: dto.signature_ecdsa,
      vet_signed_at: new Date(),
      tutor_consent_timestamp: dto.tutor_consent_timestamp,
      tutor_consent_ip: dto.tutor_consent_ip,
      tutor_consent_document_version: dto.tutor_consent_document_version,
      tutor_consent_signature_image_url: tutorSignatureUrl,
      version: 1, // Sincronização inicial
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
}
