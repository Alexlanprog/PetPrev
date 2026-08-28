import { Controller, Post, Body, UploadedFile, UseInterceptors, UseGuards, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MedicalRecordsService, CreateMedicalRecordDto } from './services/medical-records.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RBACGuard } from '../../common/guards/rbac.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../database/enums';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Express } from 'express';

@Controller('medical-records')
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

  @Post('signed')
  @UseGuards(JwtAuthGuard, RBACGuard)
  @Roles(UserRole.VET_FIELD)
  @UseInterceptors(FileInterceptor('tutorSignaturePhoto'))
  async createSignedRecord(
    @Body() dto: CreateMedicalRecordDto,
    @UploadedFile() tutorSignaturePhoto: any,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!dto.signature_ecdsa || !dto.payload_signed) {
      throw new BadRequestException('A assinatura ECDSA (signature_ecdsa) e o payload assinado (payload_signed) são obrigatórios.');
    }

    return await this.medicalRecordsService.createSignedRecord(
      user.userId,
      dto,
      tutorSignaturePhoto,
    );
  }
}
