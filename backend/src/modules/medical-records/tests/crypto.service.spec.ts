import { Test, TestingModule } from '@nestjs/testing';
import { CryptoService } from '../services/crypto.service';
import * as crypto from 'crypto';

describe('CryptoService', () => {
  let service: CryptoService;

  // Gerar um par de chaves efêmero para os testes
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1', // Curva suportada e comum em ECDSA
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CryptoService],
    }).compile();

    service = module.get<CryptoService>(CryptoService);
  });

  it('deve validar corretamente uma assinatura ECDSA gerada com a chave privada correspondente', () => {
    const payload = JSON.stringify({ appointmentId: 'app-123', petId: 'pet-123', diagnosis: 'healthy' });

    // Vet assina no app mobile (simulado aqui)
    const signer = crypto.createSign('SHA256');
    signer.update(payload);
    signer.end();
    const signatureBase64 = signer.sign(privateKey, 'base64');

    // Validação no backend
    const isValid = service.verifyEcdsaSignature(payload, signatureBase64, publicKey);
    expect(isValid).toBe(true);
  });

  it('deve rejeitar uma assinatura ECDSA se o payload for adulterado', () => {
    const originalPayload = JSON.stringify({ appointmentId: 'app-123', petId: 'pet-123', diagnosis: 'healthy' });
    const tamperedPayload = JSON.stringify({ appointmentId: 'app-123', petId: 'pet-123', diagnosis: 'sick' });

    // Vet assina o payload original
    const signer = crypto.createSign('SHA256');
    signer.update(originalPayload);
    signer.end();
    const signatureBase64 = signer.sign(privateKey, 'base64');

    // Validação no backend recebendo o payload adulterado (com a mesma assinatura)
    const isValid = service.verifyEcdsaSignature(tamperedPayload, signatureBase64, publicKey);
    expect(isValid).toBe(false);
  });

  it('deve rejeitar a assinatura se for assinada com outra chave privada', () => {
    const payload = JSON.stringify({ data: 'secret' });
    
    // Hacker gerando a própria chave para tentar falsificar
    const fakeKeys = crypto.generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    const signer = crypto.createSign('SHA256');
    signer.update(payload);
    signer.end();
    const hackerSignature = signer.sign(fakeKeys.privateKey, 'base64');

    // Backend valida usando a chave pública legítima do Vet
    const isValid = service.verifyEcdsaSignature(payload, hackerSignature, publicKey);
    expect(isValid).toBe(false);
  });
});
