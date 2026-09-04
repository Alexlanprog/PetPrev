import { validateEnvironment } from './env.validation';

describe('validateEnvironment', () => {
  const originalAccess = process.env.JWT_ACCESS_SECRET;
  const originalRefresh = process.env.JWT_REFRESH_SECRET;

  afterEach(() => {
    process.env.JWT_ACCESS_SECRET = originalAccess;
    process.env.JWT_REFRESH_SECRET = originalRefresh;
  });

  it('deve aprovar quando ambas as chaves JWT tiverem 32 ou mais caracteres', () => {
    const validConfig = {
      JWT_ACCESS_SECRET: '12345678901234567890123456789012_access',
      JWT_REFRESH_SECRET: '12345678901234567890123456789012_refresh',
    };

    const result = validateEnvironment(validConfig);
    expect(result).toEqual(validConfig);
  });

  it('deve lançar erro se JWT_ACCESS_SECRET estiver ausente', () => {
    delete process.env.JWT_ACCESS_SECRET;
    const invalidConfig = {
      JWT_REFRESH_SECRET: '12345678901234567890123456789012_refresh',
    };

    expect(() => validateEnvironment(invalidConfig)).toThrow(
      'Configuração Inválida: JWT_ACCESS_SECRET é obrigatório e deve ter no mínimo 32 caracteres.',
    );
  });

  it('deve lançar erro se JWT_ACCESS_SECRET for menor que 32 caracteres', () => {
    delete process.env.JWT_ACCESS_SECRET;
    const invalidConfig = {
      JWT_ACCESS_SECRET: 'too_short_key',
      JWT_REFRESH_SECRET: '12345678901234567890123456789012_refresh',
    };

    expect(() => validateEnvironment(invalidConfig)).toThrow(
      'Configuração Inválida: JWT_ACCESS_SECRET é obrigatório e deve ter no mínimo 32 caracteres.',
    );
  });

  it('deve lançar erro se JWT_REFRESH_SECRET for menor que 32 caracteres', () => {
    delete process.env.JWT_REFRESH_SECRET;
    const invalidConfig = {
      JWT_ACCESS_SECRET: '12345678901234567890123456789012_access',
      JWT_REFRESH_SECRET: 'short_refresh_secret',
    };

    expect(() => validateEnvironment(invalidConfig)).toThrow(
      'Configuração Inválida: JWT_REFRESH_SECRET é obrigatório e deve ter no mínimo 32 caracteres.',
    );
  });
});
