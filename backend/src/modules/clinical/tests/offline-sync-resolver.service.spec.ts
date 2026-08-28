import { Test, TestingModule } from '@nestjs/testing';
import { OfflineSyncResolverService } from '../services/offline-sync-resolver.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MedicalRecordEntity } from '../../../database/entities/medical-record.entity';
import { AuditLogEntity } from '../../../database/entities/audit-log.entity';

describe('OfflineSyncResolverService', () => {
  let service: OfflineSyncResolverService;
  let medicalRecordRepository: any;
  let auditLogRepository: any;

  const mockMedicalRecordRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockAuditLogRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OfflineSyncResolverService,
        {
          provide: getRepositoryToken(MedicalRecordEntity),
          useValue: mockMedicalRecordRepository,
        },
        {
          provide: getRepositoryToken(AuditLogEntity),
          useValue: mockAuditLogRepository,
        },
      ],
    }).compile();

    service = module.get<OfflineSyncResolverService>(OfflineSyncResolverService);
    medicalRecordRepository = module.get(getRepositoryToken(MedicalRecordEntity));
    auditLogRepository = module.get(getRepositoryToken(AuditLogEntity));
  });

  const incomingRecord = {
    appointment_id: 'app-123',
    pet_id: 'pet-123',
    weight_recorded: 5.5,
    temperature_body: 38.5,
    clinical_notes: 'Rotina',
    tutor_consent_ip: '192.168.0.1',
  };

  it('deve salvar como versão 1 e sem conflito se não houver registro prévio', async () => {
    mockMedicalRecordRepository.findOne.mockResolvedValue(null);
    mockMedicalRecordRepository.create.mockImplementation((dto: any) => dto);
    mockMedicalRecordRepository.save.mockImplementation(async (dto: any) => ({ ...dto, id: 'record-1' }));

    const result = await service.resolveMedicalRecordSync(incomingRecord, 'vet-123');

    expect(result.version).toBe(1);
    expect(result.has_conflict).toBe(false);
    expect(mockMedicalRecordRepository.save).toHaveBeenCalled();
    expect(mockAuditLogRepository.save).not.toHaveBeenCalled();
  });

  it('deve incrementar versão e marcar com has_conflict = true se houver registro prévio (Append-Only)', async () => {
    mockMedicalRecordRepository.findOne.mockResolvedValue({
      id: 'old-record-1',
      version: 1,
      appointment_id: 'app-123',
      pet_id: 'pet-123',
    });

    mockMedicalRecordRepository.create.mockImplementation((dto: any) => dto);
    mockMedicalRecordRepository.save.mockImplementation(async (dto: any) => ({ ...dto, id: 'record-2' }));
    mockAuditLogRepository.create.mockImplementation((dto: any) => dto);
    mockAuditLogRepository.save.mockResolvedValue(true);

    const result = await service.resolveMedicalRecordSync(incomingRecord, 'vet-123');

    expect(result.version).toBe(2);
    expect(result.has_conflict).toBe(true);
    expect(mockAuditLogRepository.save).toHaveBeenCalled();
  });
});
