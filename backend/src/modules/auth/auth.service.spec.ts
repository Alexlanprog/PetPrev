import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from '../../database/entities/user.entity';
import { UserSessionEntity } from '../../database/entities/user-session.entity';
import { RedisService } from '../redis/redis.service';
import { BadRequestException, UnauthorizedException, HttpException } from '@nestjs/common';
import { UserRole } from '../../database/enums';

describe('AuthService', () => {
  let authService: AuthService;
  let redisService: RedisService;
  let userRepository: any;
  let sessionRepository: any;
  let jwtService: JwtService;

  const mockRedisService = {
    isOtpInCooldown: jest.fn(),
    getRemainingCooldown: jest.fn(),
    setOtp: jest.fn(),
    setOtpCooldown: jest.fn(),
    getOtpData: jest.fn(),
    incrementOtpAttempts: jest.fn(),
    deleteOtp: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockSessionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock_jwt_access_token'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(UserSessionEntity),
          useValue: mockSessionRepository,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    redisService = module.get<RedisService>(RedisService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('requestOtp', () => {
    it('deve gerar e salvar código OTP no Redis quando não estiver em cooldown', async () => {
      mockRedisService.isOtpInCooldown.mockResolvedValue(false);
      mockRedisService.setOtp.mockResolvedValue(undefined);
      mockRedisService.setOtpCooldown.mockResolvedValue(undefined);

      const result = await authService.requestOtp({ phone_number: '+5511999998888' });

      expect(result.success).toBe(true);
      expect(result.expiresInSeconds).toBe(180);
      expect(mockRedisService.setOtp).toHaveBeenCalledTimes(1);
      expect(mockRedisService.setOtpCooldown).toHaveBeenCalledTimes(1);
    });

    it('deve lançar HttpException 429 quando estiver em período de cooldown', async () => {
      mockRedisService.isOtpInCooldown.mockResolvedValue(true);
      mockRedisService.getRemainingCooldown.mockResolvedValue(45);

      await expect(
        authService.requestOtp({ phone_number: '+5511999998888' }),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('verifyOtp', () => {
    it('deve lançar BadRequestException se o OTP não existir ou tiver expirado', async () => {
      mockRedisService.getOtpData.mockResolvedValue(null);

      await expect(
        authService.verifyOtp(
          { phone_number: '+5511999998888', code: '123456' },
          '127.0.0.1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar UnauthorizedException e incrementar tentativas se o código estiver incorreto', async () => {
      mockRedisService.getOtpData.mockResolvedValue({ code: '654321', attempts: 0 });
      mockRedisService.incrementOtpAttempts.mockResolvedValue(1);

      await expect(
        authService.verifyOtp(
          { phone_number: '+5511999998888', code: '111111' },
          '127.0.0.1',
        ),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockRedisService.incrementOtpAttempts).toHaveBeenCalledWith('+5511999998888');
    });

    it('deve deletar OTP e bloquear se exceder 3 tentativas incorretas', async () => {
      mockRedisService.getOtpData.mockResolvedValue({ code: '654321', attempts: 2 });
      mockRedisService.incrementOtpAttempts.mockResolvedValue(3);

      await expect(
        authService.verifyOtp(
          { phone_number: '+5511999998888', code: '111111' },
          '127.0.0.1',
        ),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockRedisService.deleteOtp).toHaveBeenCalledWith('+5511999998888');
    });

    it('deve autenticar com sucesso e criar sessão quando o código estiver correto', async () => {
      const phone = '+5511999998888';
      mockRedisService.getOtpData.mockResolvedValue({ code: '123456', attempts: 0 });
      mockRedisService.deleteOtp.mockResolvedValue(undefined);

      const mockUser: Partial<UserEntity> = {
        id: 'user-uuid-123',
        phone_number: phone,
        role: UserRole.TUTOR,
        is_active: true,
        cpf: '123.456.789-00',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockSessionRepository.create.mockReturnValue({ id: 'session-uuid-456' });
      mockSessionRepository.save.mockResolvedValue({ id: 'session-uuid-456' });

      const result = await authService.verifyOtp(
        { phone_number: phone, code: '123456' },
        '127.0.0.1',
      );

      expect(result.access_token).toBe('mock_jwt_access_token');
      expect(result.refresh_token).toBeDefined();
      expect(result.user.phone_number).toBe(phone);
      expect(mockRedisService.deleteOtp).toHaveBeenCalledWith(phone);
      expect(mockSessionRepository.save).toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('deve rotacionar tokens e revogar a sessão anterior com sucesso', async () => {
      const rawToken = 'valid_raw_refresh_token';
      const mockUser: Partial<UserEntity> = {
        id: 'user-uuid-123',
        phone_number: '+5511999998888',
        role: UserRole.TUTOR,
        is_active: true,
      };

      const mockSession = {
        id: 'old-session-123',
        user: mockUser,
        is_revoked: false,
        device_info: 'iPhone 15',
      };

      mockSessionRepository.findOne.mockResolvedValue(mockSession);
      mockSessionRepository.save.mockImplementation((s: any) => Promise.resolve(s));
      mockSessionRepository.create.mockReturnValue({ id: 'new-session-456' });

      const result = await authService.refreshToken(
        { refresh_token: rawToken },
        '127.0.0.1',
      );

      expect(mockSession.is_revoked).toBe(true);
      expect(result.access_token).toBe('mock_jwt_access_token');
      expect(result.refresh_token).toBeDefined();
    });

    it('deve lançar UnauthorizedException para token inválido ou já revogado', async () => {
      mockSessionRepository.findOne.mockResolvedValue(null);

      await expect(
        authService.refreshToken({ refresh_token: 'invalid_or_revoked_token' }, '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('deve marcar a sessão como revogada', async () => {
      mockSessionRepository.update.mockResolvedValue({ affected: 1 });

      const result = await authService.logout('session-uuid-123');
      expect(result.success).toBe(true);
      expect(mockSessionRepository.update).toHaveBeenCalledWith(
        { id: 'session-uuid-123' },
        { is_revoked: true },
      );
    });
  });
});
