import { Test, TestingModule } from '@nestjs/testing';
import { TeleorientationService } from '../services/teleorientation.service';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TeleorientationSessionEntity } from '../../../database/entities/teleorientation-session.entity';
import { AppointmentEntity } from '../../../database/entities/appointment.entity';
import { AppointmentStatus } from '../../../database/enums';
import { InternalServerErrorException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken'; // Para fazer parse/verificação do token JWT gerado pelo SDK (mock/dummy parse)

describe('TeleorientationService', () => {
  let service: TeleorientationService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'LIVEKIT_API_KEY') return 'test_key';
      if (key === 'LIVEKIT_API_SECRET') return 'test_secret';
      return null;
    }),
  };

  const mockTeleorientationRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockAppointmentRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeleorientationService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: getRepositoryToken(TeleorientationSessionEntity), useValue: mockTeleorientationRepository },
        { provide: getRepositoryToken(AppointmentEntity), useValue: mockAppointmentRepository },
      ],
    }).compile();

    service = module.get<TeleorientationService>(TeleorientationService);
  });

  it('deve gerar um token JWT do LiveKit para o Veterinário com gravação desabilitada', async () => {
    mockAppointmentRepository.findOne.mockResolvedValue({
      id: 'app-1',
      status: AppointmentStatus.REQUESTED,
    });
    mockTeleorientationRepository.findOne.mockResolvedValue(null);
    mockTeleorientationRepository.create.mockImplementation((dto) => dto);

    const token = await service.generateRoomToken('app-1', 'vet-123', true);
    
    expect(token).toBeDefined();
    
    // Decodifica o payload sem verificar assinatura (pois não temos a env real injetada perfeitamente na lib do test)
    const decoded: any = jwt.decode(token);
    
    // Verifica se os grants estão corretos
    expect(decoded.video.room).toBe('room_appt_app-1');
    expect(decoded.video.roomRecord).toBe(false); // REGRA DE NEGÓCIO CFMV
    expect(decoded.sub).toBe('vet_vet-123');
  });

  it('deve lançar exceção se o agendamento não for encontrado', async () => {
    mockAppointmentRepository.findOne.mockResolvedValue(null);

    await expect(service.generateRoomToken('app-inexistente', 'tutor-123', false))
      .rejects.toThrow(InternalServerErrorException);
  });

  it('deve lançar exceção se o agendamento estiver cancelado', async () => {
    mockAppointmentRepository.findOne.mockResolvedValue({
      id: 'app-1',
      status: AppointmentStatus.CANCELED,
    });

    await expect(service.generateRoomToken('app-1', 'tutor-123', false))
      .rejects.toThrow(InternalServerErrorException);
  });

  it('deve retornar acesso via LiveKit quando chaves de API estiverem presentes', async () => {
    mockAppointmentRepository.findOne.mockResolvedValue({
      id: 'app-1',
      status: AppointmentStatus.REQUESTED,
    });
    mockTeleorientationRepository.findOne.mockResolvedValue(null);
    mockTeleorientationRepository.create.mockImplementation((dto) => dto);

    const access = await service.getRoomAccess('app-1', 'vet-123', true);
    expect(access.provider).toBe('livekit');
    expect(access.token).toBeDefined();
    expect(access.roomName).toBe('room_appt_app-1');
  });

  it('deve recorrer ao provedor mvp_fallback quando credenciais do LiveKit estiverem ausentes', async () => {
    mockConfigService.get.mockReturnValue(null); // Sem credenciais
    mockAppointmentRepository.findOne.mockResolvedValue({
      id: 'app-2',
      status: AppointmentStatus.REQUESTED,
    });

    const access = await service.getRoomAccess('app-2', 'tutor-456', false);
    expect(access.provider).toBe('mvp_fallback');
    expect(access.token).toBeNull();
    expect(access.meetingUrl).toContain('meet.jit.si/petprev_room_appt_app-2');
  });
});
