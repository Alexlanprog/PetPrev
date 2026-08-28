import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { extname } from 'path';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client;

  constructor(private readonly configService: ConfigService) {
    // Configura o S3Client para apontar para o MinIO local
    this.s3Client = new S3Client({
      region: this.configService.get<string>('MINIO_REGION', 'us-east-1'),
      endpoint: this.configService.get<string>('MINIO_ENDPOINT', 'http://localhost:9000'),
      forcePathStyle: true, // Necessário para o MinIO
      credentials: {
        accessKeyId: this.configService.get<string>('MINIO_ROOT_USER', 'petprev_admin'),
        secretAccessKey: this.configService.get<string>('MINIO_ROOT_PASSWORD', 'petprev_secure_password'),
      },
    });
  }

  /**
   * Faz o upload de um arquivo para o MinIO (S3 compatível).
   * @param bucket Nome do bucket destino
   * @param fileName Nome do arquivo original
   * @param fileBuffer Conteúdo do arquivo
   * @param mimetype Tipo MIME do arquivo
   * @returns A URL assinada ou o path relativo para armazenamento no banco
   */
  async uploadFile(
    bucket: string,
    fileName: string,
    fileBuffer: Buffer,
    mimetype: string,
  ): Promise<string> {
    const timestamp = Date.now();
    const extension = extname(fileName);
    const basename = fileName.replace(extension, '');
    const objectKey = `${basename}-${timestamp}${extension}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: fileBuffer,
      ContentType: mimetype,
    });

    try {
      await this.s3Client.send(command);
      this.logger.log(`Arquivo ${objectKey} enviado com sucesso para o bucket ${bucket}.`);
      
      // Retorna a URI interna que será salva no banco
      return `s3://${bucket}/${objectKey}`;
    } catch (error) {
      this.logger.error(`Erro ao enviar arquivo para o S3 (MinIO): ${error.message}`);
      throw new Error('Falha no upload do arquivo para o storage.');
    }
  }
}
