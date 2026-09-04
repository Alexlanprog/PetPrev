import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  UnprocessableEntityException,
  BadGatewayException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { MedicalRecordsService } from '../services/medical-records.service';
import { CryptoService } from '../services/crypto.service';
import { StorageService } from '../../storage/storage.service';
import { MedicalRecordEntity } from '../../../database/entities/medical-record.entity';
import { VeterinarianEntity } from '../../../database/entities/veterinarian.entity';
import { PetEntity } from '../../../database/entities/pet.entity';
import { AppointmentEntity } from '../../../database/entities/appointment.entity';
import { UserRole, AppointmentStatus } from '../../../database/enums';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';

describe('MedicalRecordsService (Security Tests)', () => {
  let service: MedicalRecordsService;
  let medicalRecordRepo: any;
  let veterinarianRepo: any;
  let petRepo: any;
  let appointmentRepo: any;
  let cryptoService: any;
  let storageService: any;

  const originalEnv = process.env.NODE_ENV;

  beforeEach(async () => {
    process.env.NODE_ENV = 'development';

    medicalRecordRepo = {
      create: jest.fn().mockImplementation((val) => ({ id: 'record-uuid-1', ...val })),
      save: jest.fn().mockImplementation(async (val) => ({ id: 'record-uuid-1', ...val })),
      find: jest.fn().mockResolvedValue([]),
    };

    veterinarianRepo = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((val) => ({ id: 'vet-uuid-1', ...val })),
      save: jest.fn().mockImplementation(async (val) => ({ id: 'vet-uuid-1', ...val })),
    };

    petRepo = {
      findOne: jest.fn(),
    };

    appointmentRepo = {
      findOne: jest.fn(),
    };

    cryptoService = {
      generateHash: jest.fn().mockReturnValue('mock_sha256_hash'),
      verifyEcdsaSignature: jest.fn(),
    };

    storageService = {
      uploadFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MedicalRecordsService,
        {
          provide: getRepositoryToken(MedicalRecordEntity),
          useValue: medicalRecordRepo,
        },
        {
          provide: getRepositoryToken(VeterinarianEntity),
          useValue: veterinarianRepo,
        },
        {
          provide: getRepositoryToken(PetEntity),
          useValue: petRepo,
        },
        {
          provide: getRepositoryToken(AppointmentEntity),
          useValue: appointmentRepo,
        },
        {
          provide: CryptoService,
          useValue: cryptoService,
        },
        {
          provide: StorageService,
          useValue: storageService,
        },
      ],
    }).compile();

    service = module.get<MedicalRecordsService>(MedicalRecordsService);
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('Item 5: Bloqueio de Assinatura Simulada (MOCK) em Produção', () => {
    const mockDto = {
      appointment_id: 'app-uuid-1',
      pet_id: 'pet-uuid-1',
      weight_recorded: 25.5,
      temperature_body: 38.5,
      clinical_notes: 'Exame de rotina.',
      signature_ecdsa: 'MOCK_SIG_SIMULATED_TEST',
      payload_signed: JSON.stringify({ note: 'ok' }),
      tutor_consent_timestamp: new Date(),
      tutor_consent_ip: '127.0.0.1',
      tutor_consent_document_version: 'v1.0',
    };

    it('deve rejeitar assinatura MOCK com UnprocessableEntityException quando NODE_ENV=production', async () => {
      process.env.NODE_ENV = 'production';

      veterinarianRepo.findOne.mockResolvedValue({
        id: 'vet-uuid-1',
        user_id: 'vet-user-1',
        public_key_pem: 'mock_pem_key',
      });

      await expect(service.createSignedRecord('vet-user-1', mockDto)).rejects.toThrow(
        UnprocessableEntityException,
      );
      await expect(service.createSignedRecord('vet-user-1', mockDto)).rejects.toThrow(
        'Assinaturas simuladas (MOCK) não são aceitas em ambiente de produção.',
      );

      expect(medicalRecordRepo.save).not.toHaveBeenCalled();
    });

    it('deve permitir assinatura MOCK quando NODE_ENV !== production', async () => {
      process.env.NODE_ENV = 'development';

      veterinarianRepo.findOne.mockResolvedValue({
        id: 'vet-uuid-1',
        user_id: 'vet-user-1',
        public_key_pem: null,
      });

      const result = await service.createSignedRecord('vet-user-1', mockDto);

      expect(result).toBeDefined();
      expect(result.vet_digital_signature_base64).toBe('MOCK_SIG_SIMULATED_TEST');
      expect(medicalRecordRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('Item 6: Falha no Upload de Assinatura para o Storage', () => {
    const mockDto = {
      appointment_id: 'app-uuid-1',
      pet_id: 'pet-uuid-1',
      weight_recorded: 25.5,
      temperature_body: 38.5,
      clinical_notes: 'Exame de rotina.',
      signature_ecdsa: 'MOCK_SIG_TEST',
      payload_signed: JSON.stringify({ note: 'ok' }),
      tutor_consent_timestamp: new Date(),
      tutor_consent_ip: '127.0.0.1',
      tutor_consent_document_version: 'v1.0',
    };

    const mockFile = {
      originalname: 'tutor_sig.png',
      buffer: Buffer.from('fake_image_bytes'),
      mimetype: 'image/png',
    };

    it('deve lançar BadGatewayException e NÃO salvar prontuário se o upload falhar', async () => {
      veterinarianRepo.findOne.mockResolvedValue({
        id: 'vet-uuid-1',
        user_id: 'vet-user-1',
      });

      storageService.uploadFile.mockRejectedValue(new Error('MinIO connection refused'));

      await expect(
        service.createSignedRecord('vet-user-1', mockDto, mockFile),
      ).rejects.toThrow(BadGatewayException);

      await expect(
        service.createSignedRecord('vet-user-1', mockDto, mockFile),
      ).rejects.toThrow(
        'Falha ao salvar assinatura do tutor. Tente novamente.',
      );

      expect(medicalRecordRepo.save).not.toHaveBeenCalled();
    });

    it('deve salvar prontuário com a URL real retornada pelo storage quando o upload tem sucesso', async () => {
      veterinarianRepo.findOne.mockResolvedValue({
        id: 'vet-uuid-1',
        user_id: 'vet-user-1',
      });

      storageService.uploadFile.mockResolvedValue('https://storage.petprev.com.br/petprev-records/real-sig.png');

      const result = await service.createSignedRecord('vet-user-1', mockDto, mockFile);

      expect(result).toBeDefined();
      expect(result.tutor_consent_signature_image_url).toBe(
        'https://storage.petprev.com.br/petprev-records/real-sig.png',
      );
      expect(medicalRecordRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('Item 4: Prevenção de IDOR em findByPetId', () => {
    const petId = 'pet-uuid-10';
    const mockTutorUser: CurrentUserPayload = {
      userId: 'tutor-user-owner',
      phone_number: '+5571999990001',
      role: UserRole.TUTOR,
    };
    const mockAttackerTutor: CurrentUserPayload = {
      userId: 'tutor-user-attacker',
      phone_number: '+5571999990002',
      role: UserRole.TUTOR,
    };
    const mockVetField: CurrentUserPayload = {
      userId: 'vet-user-1',
      phone_number: '+5571999990003',
      role: UserRole.VET_FIELD,
    };
    const mockRT: CurrentUserPayload = {
      userId: 'rt-user-1',
      phone_number: '+5511999990004',
      role: UserRole.VET_RESPONSAVEL_TECNICO,
    };
    const mockAdmin: CurrentUserPayload = {
      userId: 'admin-user-1',
      phone_number: '+5511999990005',
      role: UserRole.ADMIN_GERAL,
    };

    const mockPet = {
      id: petId,
      name: 'Thor',
      tutor: {
        id: 'tutor-profile-1',
        user_id: 'tutor-user-owner',
      },
    };

    it('deve lançar NotFoundException se o pet não existir', async () => {
      petRepo.findOne.mockResolvedValue(null);

      await expect(service.findByPetId('non-existent-pet', mockTutorUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar ForbiddenException (403) quando tutor B tenta acessar prontuário do pet do tutor A', async () => {
      petRepo.findOne.mockResolvedValue(mockPet);

      await expect(service.findByPetId(petId, mockAttackerTutor)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.findByPetId(petId, mockAttackerTutor)).rejects.toThrow(
        'Acesso negado: Você não possui permissão para visualizar o prontuário deste pet.',
      );
    });

    it('deve permitir acesso quando o tutor for o legítimo dono do pet', async () => {
      petRepo.findOne.mockResolvedValue(mockPet);
      const mockRecords = [{ id: 'record-1', pet_id: petId }];
      medicalRecordRepo.find.mockResolvedValue(mockRecords);

      const records = await service.findByPetId(petId, mockTutorUser);

      expect(records).toEqual(mockRecords);
      expect(medicalRecordRepo.find).toHaveBeenCalledWith({
        where: { pet_id: petId },
        relations: ['veterinarian', 'appointment'],
        order: { created_at: 'DESC' },
      });
    });

    it('deve lançar ForbiddenException se VET_FIELD não possuir agendamento confirmado ou concluído com o pet', async () => {
      petRepo.findOne.mockResolvedValue(mockPet);
      veterinarianRepo.findOne.mockResolvedValue({ id: 'vet-profile-1', user_id: 'vet-user-1' });
      // Simula que não encontrou agendamento válido nos status permitidos (ex: CANCELADO ou REQUESTED)
      appointmentRepo.findOne.mockResolvedValue(null);

      await expect(service.findByPetId(petId, mockVetField)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.findByPetId(petId, mockVetField)).rejects.toThrow(
        'Acesso negado: Veterinário de campo não possui agendamento confirmado ou concluído vinculado a este pet.',
      );
    });

    it('deve permitir acesso para VET_FIELD se houver agendamento confirmado ou concluído vinculado ao pet', async () => {
      petRepo.findOne.mockResolvedValue(mockPet);
      veterinarianRepo.findOne.mockResolvedValue({ id: 'vet-profile-1', user_id: 'vet-user-1' });
      appointmentRepo.findOne.mockResolvedValue({
        id: 'app-1',
        pet_id: petId,
        veterinarian_id: 'vet-profile-1',
        status: AppointmentStatus.COMPLETED,
      });

      const mockRecords = [{ id: 'record-1', pet_id: petId }];
      medicalRecordRepo.find.mockResolvedValue(mockRecords);

      const records = await service.findByPetId(petId, mockVetField);
      expect(records).toEqual(mockRecords);
    });

    it('deve permitir acesso irrestrito para VET_RESPONSAVEL_TECNICO (RT)', async () => {
      petRepo.findOne.mockResolvedValue(mockPet);
      const mockRecords = [{ id: 'record-1', pet_id: petId }];
      medicalRecordRepo.find.mockResolvedValue(mockRecords);

      const records = await service.findByPetId(petId, mockRT);
      expect(records).toEqual(mockRecords);
    });

    it('deve permitir acesso irrestrito para ADMIN_GERAL', async () => {
      petRepo.findOne.mockResolvedValue(mockPet);
      const mockRecords = [{ id: 'record-1', pet_id: petId }];
      medicalRecordRepo.find.mockResolvedValue(mockRecords);

      const records = await service.findByPetId(petId, mockAdmin);
      expect(records).toEqual(mockRecords);
    });
  });
});
