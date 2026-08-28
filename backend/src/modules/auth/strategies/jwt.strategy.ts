import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../../database/entities/user.entity';

export interface JwtPayload {
  sub: string; // user.id
  phone_number: string;
  role: string;
  sessionId?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_ACCESS_SECRET ||
        'petprev_access_token_jwt_secret_key_change_me_in_prod_min_32_chars',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub, is_active: true },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Token inválido ou usuário inativo no sistema.',
      );
    }

    return {
      userId: user.id,
      phone_number: user.phone_number,
      role: user.role,
      sessionId: payload.sessionId,
    };
  }
}
