import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  private readonly logger = new Logger(CryptoService.name);

  /**
   * Valida a assinatura digital ECDSA de um payload JSON.
   * Utiliza SHA-256 para o hashing interno da assinatura.
   * 
   * @param payload Objeto contendo os dados que foram assinados.
   * @param signature Assinatura em base64 recebida do cliente.
   * @param publicKeyPem Chave pública PEM (geralmente salva no cadastro do vet).
   * @returns Retorna verdadeiro se a assinatura for autêntica e íntegra.
   */
  public verifyEcdsaSignature(payload: any, signature: string, publicKeyPem: string): boolean {
    try {
      // 1. Converter o payload para string determinística (ordem importa na assinatura,
      //    recomendamos que o client passe o payload exato que foi stringificado).
      //    Se for um objeto, serializamos aqui (apenas para fallback).
      const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);

      // 2. Criar o objeto de verificação
      const verifier = crypto.createVerify('SHA256');
      verifier.update(payloadString);
      verifier.end();

      // 3. Validar a assinatura
      const isValid = verifier.verify(publicKeyPem, signature, 'base64');
      
      if (!isValid) {
        this.logger.warn(`Assinatura ECDSA inválida detectada para o payload.`);
      }

      return isValid;
    } catch (error) {
      this.logger.error(`Erro ao validar assinatura criptográfica: ${error.message}`);
      return false;
    }
  }

  /**
   * Função utilitária para gerar hash de integridade de prontuários.
   * Utilizada internamente caso o banco não o faça.
   */
  public generateHash(payload: any): string {
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto.createHash('sha256').update(payloadString).digest('hex');
  }
}
