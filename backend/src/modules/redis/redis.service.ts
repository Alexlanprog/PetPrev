import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  onModuleInit() {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = parseInt(process.env.REDIS_PORT || '6379', 10);
    const password = process.env.REDIS_PASSWORD || undefined;

    this.client = new Redis({
      host,
      port,
      password: password && password.trim() !== '' ? password : undefined,
      lazyConnect: true,
      retryStrategy: (times) => {
        const delay = Math.min(times * 200, 2000);
        return delay;
      },
    });

    this.client
      .connect()
      .then(() => {
        this.logger.log(`Conectado com sucesso ao Redis (${host}:${port})`);
      })
      .catch((err) => {
        this.logger.warn(
          `Aviso: Não foi possível conectar ao Redis imediatamente (${err.message}). Tentativas em background continuarão.`,
        );
      });
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }

  getClient(): Redis {
    return this.client;
  }

  // --- Operações de OTP ---

  private getOtpKey(phone: string): string {
    return `otp:code:${phone}`;
  }

  private getCooldownKey(phone: string): string {
    return `otp:cooldown:${phone}`;
  }

  async setOtp(
    phone: string,
    code: string,
    ttlSeconds: number,
  ): Promise<void> {
    const key = this.getOtpKey(phone);
    const payload = JSON.stringify({ code, attempts: 0 });
    await this.client.set(key, payload, 'EX', ttlSeconds);
  }

  async getOtpData(
    phone: string,
  ): Promise<{ code: string; attempts: number } | null> {
    const key = this.getOtpKey(phone);
    const data = await this.client.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  async incrementOtpAttempts(phone: string): Promise<number> {
    const key = this.getOtpKey(phone);
    const data = await this.getOtpData(phone);
    if (!data) return 0;

    data.attempts += 1;
    const ttl = await this.client.ttl(key);
    if (ttl > 0) {
      await this.client.set(key, JSON.stringify(data), 'EX', ttl);
    }
    return data.attempts;
  }

  async deleteOtp(phone: string): Promise<void> {
    const key = this.getOtpKey(phone);
    await this.client.del(key);
  }

  async setOtpCooldown(phone: string, cooldownSeconds: number): Promise<void> {
    const key = this.getCooldownKey(phone);
    await this.client.set(key, '1', 'EX', cooldownSeconds);
  }

  async isOtpInCooldown(phone: string): Promise<boolean> {
    const key = this.getCooldownKey(phone);
    const exists = await this.client.exists(key);
    return exists === 1;
  }

  async getRemainingCooldown(phone: string): Promise<number> {
    const key = this.getCooldownKey(phone);
    const ttl = await this.client.ttl(key);
    return ttl > 0 ? ttl : 0;
  }
}
