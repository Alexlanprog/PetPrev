import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  Body,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MedicalRecordsService, CreateMedicalRecordDto } from './services/medical-records.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RBACGuard } from '../../common/guards/rbac.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../database/enums';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@Controller('medical-records')
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

  /**
   * Registro do prontuário assinado pelo veterinário
   */
  @Post('signed')
  @UseGuards(JwtAuthGuard, RBACGuard)
  @Roles(UserRole.VET_FIELD, UserRole.ADMIN_GERAL)
  @UseInterceptors(FileInterceptor('tutorSignaturePhoto'))
  async createSignedRecord(
    @Body() dto: CreateMedicalRecordDto,
    @UploadedFile() tutorSignaturePhoto: any,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!dto.signature_ecdsa || !dto.payload_signed) {
      throw new BadRequestException(
        'A assinatura ECDSA (signature_ecdsa) e o payload assinado (payload_signed) são obrigatórios.',
      );
    }

    return await this.medicalRecordsService.createSignedRecord(
      user.userId,
      dto,
      tutorSignaturePhoto,
    );
  }

  /**
   * Consulta a carteirinha digital e histórico clínico de um pet
   */
  @Get('pet/:petId')
  @UseGuards(JwtAuthGuard)
  async getRecordsByPet(@Param('petId') petId: string) {
    return await this.medicalRecordsService.findByPetId(petId);
  }

  /**
   * Consulta geral de prontuários com filtro de conflito para auditoria do RT
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async getMedicalRecords(
    @Query('has_conflict') has_conflict?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const hasConflictFilter =
      has_conflict !== undefined ? has_conflict === 'true' || has_conflict === '1' : undefined;

    return await this.medicalRecordsService.findAll({
      has_conflict: hasConflictFilter,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }
}
