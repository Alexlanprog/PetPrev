import { Controller, Post, Param, Body, UploadedFile, UseInterceptors, UseGuards, ParseFloatPipe, Req, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ColdChainService } from './services/cold-chain.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RBACGuard } from '../../common/guards/rbac.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../database/enums';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Express } from 'express';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly coldChainService: ColdChainService) {}

  /**
   * Endpoint de validação da Trava Térmica pelo app do Veterinário
   */
  @Post(':id/cold-chain')
  @UseGuards(JwtAuthGuard, RBACGuard)
  @Roles(UserRole.VET_FIELD)
  @UseInterceptors(FileInterceptor('photoEvidence'))
  async registerColdChainAudit(
    @Param('id') appointmentId: string,
    @Body('temperature', ParseFloatPipe) temperature: number,
    @UploadedFile() photoEvidence: any,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!photoEvidence) {
      throw new BadRequestException('A foto do termômetro (photoEvidence) é obrigatória.');
    }

    return await this.coldChainService.registerAudit(
      appointmentId,
      user.userId,
      temperature,
      photoEvidence.buffer,
      photoEvidence.originalname,
      photoEvidence.mimetype,
    );
  }
}
