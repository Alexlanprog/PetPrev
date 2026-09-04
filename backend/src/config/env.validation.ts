export function validateEnvironment(config: Record<string, any>) {
  const jwtAccess = config.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET;
  const jwtRefresh = config.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET;

  if (!jwtAccess || typeof jwtAccess !== 'string' || jwtAccess.trim().length < 32) {
    throw new Error(
      'Configuração Inválida: JWT_ACCESS_SECRET é obrigatório e deve ter no mínimo 32 caracteres.',
    );
  }

  if (!jwtRefresh || typeof jwtRefresh !== 'string' || jwtRefresh.trim().length < 32) {
    throw new Error(
      'Configuração Inválida: JWT_REFRESH_SECRET é obrigatório e deve ter no mínimo 32 caracteres.',
    );
  }

  return config;
}
