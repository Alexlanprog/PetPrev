import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class AsaasWebhookGuard implements CanActivate {
  private readonly logger = new Logger(AsaasWebhookGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const tokenHeader = request.headers['asaas-access-token'] as string;
    const configuredToken = process.env.ASAAS_WEBHOOK_TOKEN;

    if (!configuredToken) {
      this.logger.error('ASAAS_WEBHOOK_TOKEN não configurado nas variáveis de ambiente.');
      throw new UnauthorizedException('Token de webhook do gateway não configurado no servidor.');
    }

    if (!tokenHeader || typeof tokenHeader !== 'string') {
      this.logger.warn('Tentativa de acesso ao webhook do Asaas sem cabeçalho asaas-access-token.');
      throw new UnauthorizedException('Cabeçalho asaas-access-token ausente.');
    }

    const headerBuffer = Buffer.from(tokenHeader);
    const expectedBuffer = Buffer.from(configuredToken);

    if (headerBuffer.length !== expectedBuffer.length) {
      this.logger.warn('Tentativa de acesso ao webhook do Asaas com token inválido (tamanho divergente).');
      throw new UnauthorizedException('Token de autenticação do webhook inválido.');
    }

    const isValid = crypto.timingSafeEqual(headerBuffer, expectedBuffer);
    if (!isValid) {
      this.logger.warn('Tentativa de acesso ao webhook do Asaas com token incorreto.');
      throw new UnauthorizedException('Token de autenticação do webhook inválido.');
    }

    return true;
  }
}
