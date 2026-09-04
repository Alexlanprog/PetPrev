import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AsaasWebhookGuard } from '../guards/asaas-webhook.guard';

describe('AsaasWebhookGuard', () => {
  let guard: AsaasWebhookGuard;
  const originalEnv = process.env.ASAAS_WEBHOOK_TOKEN;

  beforeEach(() => {
    guard = new AsaasWebhookGuard();
    process.env.ASAAS_WEBHOOK_TOKEN = 'secret_webhook_token_test_12345';
  });

  afterAll(() => {
    process.env.ASAAS_WEBHOOK_TOKEN = originalEnv;
  });

  function createMockContext(headers: Record<string, string>): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers,
        }),
      }),
    } as unknown as ExecutionContext;
  }

  it('deve permitir acesso quando o cabeçalho asaas-access-token for idêntico ao configurado', () => {
    const context = createMockContext({
      'asaas-access-token': 'secret_webhook_token_test_12345',
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('deve lançar UnauthorizedException quando o cabeçalho asaas-access-token estiver ausente', () => {
    const context = createMockContext({});

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context)).toThrow('Cabeçalho asaas-access-token ausente.');
  });

  it('deve lançar UnauthorizedException quando o token for diferente (mesmo comprimento)', () => {
    const context = createMockContext({
      'asaas-access-token': 'wrong_webhook_token_test_12345',
    });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context)).toThrow('Token de autenticação do webhook inválido.');
  });

  it('deve lançar UnauthorizedException quando o token tiver comprimento diferente', () => {
    const context = createMockContext({
      'asaas-access-token': 'short_token',
    });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context)).toThrow('Token de autenticação do webhook inválido.');
  });

  it('deve lançar UnauthorizedException se ASAAS_WEBHOOK_TOKEN não estiver configurado no servidor', () => {
    delete process.env.ASAAS_WEBHOOK_TOKEN;
    const context = createMockContext({
      'asaas-access-token': 'secret_webhook_token_test_12345',
    });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context)).toThrow('Token de webhook do gateway não configurado no servidor.');
  });
});
