import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('PetPrevBootstrap');
  const app = await NestFactory.create(AppModule);

  const globalPrefix = process.env.API_PREFIX || 'api/v1';
  app.setGlobalPrefix(globalPrefix, {
    exclude: ['healthz', 'metrics', 'api/docs', 'api/docs-json'],
  });

  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || '*',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configuração interativa do Swagger / OpenAPI
  const swaggerConfig = new DocumentBuilder()
    .setTitle('PetPrev API — Saúde Preventiva Veterinária')
    .setDescription(
      'Documentação interativa dos endpoints da plataforma PetPrev (Autenticação OTP, Pets, Tutores, Agendamentos Domiciliares, Trava Térmica, Prontuários Assinados com ECDSA e Assinaturas).',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Insira o token JWT retornado pelo endpoint de login /auth/otp/verify',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'PetPrev API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`🚀 PetPrev Backend rodando na porta ${port} [Prefix: /${globalPrefix}]`);
  logger.log(`📖 Documentação Swagger disponível em: http://localhost:${port}/api/docs`);
}

bootstrap();
