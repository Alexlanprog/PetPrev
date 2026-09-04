import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import * as crypto from 'crypto';
import { UserEntity } from '../../database/entities/user.entity';
import { UserSessionEntity } from '../../database/entities/user-session.entity';
import { RedisService } from '../redis/redis.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UserRole } from '../../database/enums';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserSessionEntity)
    private readonly sessionRepository: Repository<UserSessionEntity>,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
  ) { }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * 1. Solicitação de código OTP Passwordless
   * Grava no Redis com TTL de 180s e trava de cooldown de 60s
   */
  async requestOtp(dto: RequestOtpDto) {
    const { phone_number } = dto;
    const ttl = parseInt(process.env.OTP_TTL_SECONDS || '180', 10);
    const cooldown = parseInt(process.env.OTP_COOLDOWN_SECONDS || '60', 10);

    // Verificar se está em período de cooldown
    const inCooldown = await this.redisService.isOtpInCooldown(phone_number);
    if (inCooldown) {
      const remainingSeconds = await this.redisService.getRemainingCooldown(phone_number);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Aguarde ${remainingSeconds} segundos antes de solicitar um novo código OTP.`,
          remainingSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Gerar código criptograficamente seguro de 6 dígitos (100000 - 999999)
    const code = crypto.randomInt(100000, 1000000).toString();

    // Gravar OTP e acionar cooldown no Redis
    await this.redisService.setOtp(phone_number, code, ttl);
    await this.redisService.setOtpCooldown(phone_number, cooldown);

    this.logger.log(
      `[OTP Enviado] Telefone: ${phone_number} | Código Simulado: ${code} (TTL: ${ttl}s)`,
    );

    return {
      success: true,
      message: 'Código de verificação enviado com sucesso.',
      expiresInSeconds: ttl,
    };
  }

  /**
   * 2. Verificação de código OTP, emissão de Access Token e criação de Sessão
   */
  async verifyOtp(dto: VerifyOtpDto, ip_address: string) {
    const { phone_number, code, device_info } = dto;
    const maxAttempts = parseInt(process.env.OTP_MAX_ATTEMPTS || '3', 10);

    const otpData = await this.redisService.getOtpData(phone_number);
    if (!otpData) {
      throw new BadRequestException(
        'Código de verificação expirado ou não solicitado. Por favor, solicite um novo código.',
      );
    }

    if (otpData.code !== code) {
      const attempts = await this.redisService.incrementOtpAttempts(phone_number);
      if (attempts >= maxAttempts) {
        await this.redisService.deleteOtp(phone_number);
        throw new UnauthorizedException(
          'Número máximo de 3 tentativas incorretas excedido. Solicite um novo código.',
        );
      }
      throw new UnauthorizedException(
        `Código incorreto. Você tem mais ${maxAttempts - attempts} tentativa(s).`,
      );
    }

    // Código correto: limpar OTP do Redis
    await this.redisService.deleteOtp(phone_number);

    // Buscar usuário existente ou autocadastrar como TUTOR no primeiro acesso
    let user = await this.userRepository.findOne({
      where: { phone_number },
    });

    if (!user) {
      const tempCpf = `TEMP_${crypto.randomBytes(4).toString('hex')}`;
      user = this.userRepository.create({
        phone_number,
        cpf: tempCpf,
        role: UserRole.TUTOR,
        is_active: true,
      });
      user = await this.userRepository.save(user);
      this.logger.log(`Novo usuário autocadastrado via OTP: ID ${user.id} (${phone_number})`);
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Esta conta de usuário foi desativada.');
    }

    // Criar Sessão e Gerar Par de Tokens
    return await this.createSessionAndTokens(user, device_info || 'Unknown Device', ip_address);
  }

  /**
   * 3. Rotação do Refresh Token com revogação atômica da sessão anterior
   */
  async refreshToken(dto: RefreshTokenDto, ip_address: string) {
    const { refresh_token, device_info } = dto;
    const tokenHash = this.hashToken(refresh_token);

    const session = await this.sessionRepository.findOne({
      where: {
        refresh_token_hash: tokenHash,
        is_revoked: false,
        expires_at: MoreThan(new Date()),
      },
      relations: ['user'],
    });

    if (!session || !session.user) {
      throw new UnauthorizedException(
        'Refresh token inválido, expirado ou revogado. Faça login novamente.',
      );
    }

    if (!session.user.is_active) {
      throw new UnauthorizedException('Usuário inativo no sistema.');
    }

    // Revogar sessão atual (Token Rotation Security)
    session.is_revoked = true;
    await this.sessionRepository.save(session);

    // Criar nova sessão para o usuário
    return await this.createSessionAndTokens(
      session.user,
      device_info || session.device_info,
      ip_address,
    );
  }

  /**
   * 4. Encerramento de sessão (Logout)
   */
  async logout(sessionId: string) {
    if (!sessionId) return { success: true };
    await this.sessionRepository.update({ id: sessionId }, { is_revoked: true });
    return { success: true, message: 'Sessão encerrada com sucesso.' };
  }

  /**
   * Método auxiliar para emissão de par de tokens e persistência da sessão
   */
  private async createSessionAndTokens(
    user: UserEntity,
    device_info: string,
    ip_address: string,
  ) {
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenHash = this.hashToken(rawRefreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias de validade

    const session = this.sessionRepository.create({
      user_id: user.id,
      refresh_token_hash: refreshTokenHash,
      device_info,
      ip_address: ip_address || '127.0.0.1',
      is_revoked: false,
      expires_at: expiresAt,
    });

    const savedSession = await this.sessionRepository.save(session);

    const payload = {
      sub: user.id,
      phone_number: user.phone_number,
      role: user.role,
      sessionId: savedSession.id,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    });

    return {
      access_token: accessToken,
      refresh_token: rawRefreshToken,
      token_type: 'Bearer',
      expires_in: 900, // 15 minutos em segundos
      user: {
        id: user.id,
        phone_number: user.phone_number,
        email: user.email,
        cpf: user.cpf,
        role: user.role,
        is_active: user.is_active,
      },
    };
  }
}
