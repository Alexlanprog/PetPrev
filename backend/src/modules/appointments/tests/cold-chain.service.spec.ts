import { Test, TestingModule } from '@nestjs/testing';
import { ColdChainService } from '../services/cold-chain.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ColdChainAuditEntity } from '../../../database/entities/cold-chain-audit.entity';
import { AppointmentEntity } from '../../../database/entities/appointment.entity';
import { AppointmentStatus } from '../../../database/enums';
import { StorageService } from '../../storage/storage.service';
import { UnprocessableEntityException } from '@nestjs/common';

describe('ColdChainService', () => {
  let service: ColdChainService;

  const mockColdChainRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockAppointmentRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockStorageService = {
    uploadFile: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ColdChainService,
        { provide: getRepositoryToken(ColdChainAuditEntity), useValue: mockColdChainRepository },
        { provide: getRepositoryToken(AppointmentEntity), useValue: mockAppointmentRepository },
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile();

    service = module.get<ColdChainService>(ColdChainService);
  });

  const mockBuffer = Buffer.from('mockImage');

  it('deve aprovar temperatura de 5.0 graus e transicionar para IN_PROGRESS', async () => {
    const mockAppt = { id: 'app-1', veterinarian_id: 'vet-1', status: AppointmentStatus.REQUESTED };
    mockAppointmentRepository.findOne.mockResolvedValue(mockAppt);
    mockStorageService.uploadFile.mockResolvedValue('s3://bucket/test.jpg');
    mockColdChainRepository.create.mockImplementation((dto) => dto);
    
    const result = await service.registerAudit('app-1', 'vet-1', 5.0, mockBuffer, 'test.jpg', 'image/jpeg');
    
    expect(result.validation_status).toBe('VALID');
    expect(mockAppointmentRepository.save).toHaveBeenCalledWith({
      ...mockAppt,
      status: AppointmentStatus.IN_PROGRESS,
    });
  });

  it('deve rejeitar temperatura de 1.0 grau, não transicionar e lançar exceção', async () => {
    const mockAppt = { id: 'app-1', veterinarian_id: 'vet-1', status: AppointmentStatus.REQUESTED };
    mockAppointmentRepository.findOne.mockResolvedValue(mockAppt);
    mockStorageService.uploadFile.mockResolvedValue('s3://bucket/test.jpg');
    mockColdChainRepository.create.mockImplementation((dto) => dto);

    await expect(service.registerAudit('app-1', 'vet-1', 1.0, mockBuffer, 'test.jpg', 'image/jpeg'))
      .rejects.toThrow(UnprocessableEntityException);
      
    // Verifica que a auditoria foi gravada como REJEITADA antes do throw
    expect(mockColdChainRepository.save).toHaveBeenCalledWith(expect.objectContaining({ validation_status: 'BLOCKED_OUT_OF_RANGE' }));
    expect(mockAppointmentRepository.save).not.toHaveBeenCalled();
  });
});
