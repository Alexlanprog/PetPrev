import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { OfflineSyncResolverService } from './services/offline-sync-resolver.service';
import { VaccineProtocolEngine, ProtocolRule } from './domain/vaccine-engine';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RBACGuard } from '../../common/guards/rbac.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../database/enums';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@Controller('clinical')
export class ClinicalController {
  constructor(private readonly offlineSyncResolver: OfflineSyncResolverService) {}

  @Post('evaluate-vaccine')
  @UseGuards(JwtAuthGuard, RBACGuard)
  @Roles(UserRole.VET_FIELD, UserRole.VET_RESPONSAVEL_TECNICO)
  evaluateVaccine(
    @Body('species') species: 'CANINE' | 'FELINE',
    @Body('ageInWeeks') ageInWeeks: number,
    @Body('protocolRules') protocolRules: ProtocolRule[],
  ) {
    return VaccineProtocolEngine.evaluateWithRtProtocol(species, ageInWeeks, protocolRules);
  }

  @Post('sync/medical-record')
  @UseGuards(JwtAuthGuard, RBACGuard)
  @Roles(UserRole.VET_FIELD)
  async syncMedicalRecord(
    @Body() incomingRecord: any,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    // Injeta IP e Id do Veterinário a partir do request autenticado para segurança e auditoria
    return await this.offlineSyncResolver.resolveMedicalRecordSync(incomingRecord, user.userId);
  }
}
