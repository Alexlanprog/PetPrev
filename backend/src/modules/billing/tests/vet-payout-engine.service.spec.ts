import { Test, TestingModule } from '@nestjs/testing';
import { VetPayoutEngineService } from '../services/vet-payout-engine.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppointmentEntity } from '../../../database/entities/appointment.entity';
import { VetPayoutEntity } from '../../../database/entities/vet-payout.entity';
import { AppointmentStatus } from '../../../database/enums';

describe('VetPayoutEngineService', () => {
  let service: VetPayoutEngineService;

  const mockAppointmentRepository = {
    findOne: jest.fn(),
  };

  const mockVetPayoutRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VetPayoutEngineService,
        { provide: getRepositoryToken(AppointmentEntity), useValue: mockAppointmentRepository },
        { provide: getRepositoryToken(VetPayoutEntity), useValue: mockVetPayoutRepository },
      ],
    }).compile();

    service = module.get<VetPayoutEngineService>(VetPayoutEngineService);
  });

  it('deve calcular R$ 65,00 para agendamento COMPLETED com 0 km', async () => {
    mockAppointmentRepository.findOne.mockResolvedValue({
      id: 'app-1',
      vet_id: 'vet-1',
      status: AppointmentStatus.COMPLETED,
      distance_km_audited: 0,
    });
    mockVetPayoutRepository.create.mockImplementation((dto) => dto);
    mockVetPayoutRepository.save.mockImplementation(async (dto) => dto);

    const result = await service.calculateAndSchedulePayout('app-1');

    expect(result).toBeDefined();
    expect(result?.total_payout).toBe(65.00);
    expect(result?.status).toBe('SCHEDULED');
    expect(mockVetPayoutRepository.save).toHaveBeenCalled();
  });

  it('deve calcular R$ 80,00 para agendamento COMPLETED com 10 km (65 + 10 * 1.50)', async () => {
    mockAppointmentRepository.findOne.mockResolvedValue({
      id: 'app-2',
      vet_id: 'vet-1',
      status: AppointmentStatus.COMPLETED,
      distance_km_audited: 10,
    });
    mockVetPayoutRepository.create.mockImplementation((dto) => dto);
    mockVetPayoutRepository.save.mockImplementation(async (dto) => dto);

    const result = await service.calculateAndSchedulePayout('app-2');

    expect(result?.total_payout).toBe(80.00); // 65 + 15
  });

  it('não deve gerar payout se o agendamento não estiver COMPLETED', async () => {
    mockAppointmentRepository.findOne.mockResolvedValue({
      id: 'app-3',
      vet_id: 'vet-1',
      status: AppointmentStatus.IN_PROGRESS,
      distance_km_audited: 5,
    });

    const result = await service.calculateAndSchedulePayout('app-3');

    expect(result).toBeNull();
    expect(mockVetPayoutRepository.create).not.toHaveBeenCalled();
    expect(mockVetPayoutRepository.save).not.toHaveBeenCalled();
  });
});
