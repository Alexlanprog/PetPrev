import { ExecutionContext, NotFoundException } from '@nestjs/common';
import { DevEnvironmentGuard } from './dev-environment.guard';

describe('DevEnvironmentGuard', () => {
  let guard: DevEnvironmentGuard;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    guard = new DevEnvironmentGuard();
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  const mockContext = {} as ExecutionContext;

  it('deve permitir acesso em ambiente de desenvolvimento (development)', () => {
    process.env.NODE_ENV = 'development';
    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('deve permitir acesso em ambiente de teste (test)', () => {
    process.env.NODE_ENV = 'test';
    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('deve lançar NotFoundException (404) em ambiente de produção (production)', () => {
    process.env.NODE_ENV = 'production';
    expect(() => guard.canActivate(mockContext)).toThrow(NotFoundException);
    expect(() => guard.canActivate(mockContext)).toThrow('Endpoint não encontrado.');
  });
});
