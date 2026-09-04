import { Controller, Post, Param, UseGuards, Req } from '@nestjs/common';
import { TeleorientationService } from './services/teleorientation.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RBACGuard } from '../../common/guards/rbac.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../database/enums';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@Controller('communications')
export class CommunicationsController {
  constructor(private readonly teleorientationService: TeleorientationService) {}

  /**
   * Endpoint para o Tutor gerar seu Token JWT e ingressar na sala.
   */
  @Post('teleorientation/:appointmentId/join/tutor')
  @UseGuards(JwtAuthGuard, RBACGuard)
  @Roles(UserRole.TUTOR)
  async joinRoomTutor(
    @Param('appointmentId') appointmentId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return await this.teleorientationService.getRoomAccess(appointmentId, user.userId, false);
  }

  /**
   * Endpoint para o Veterinário gerar seu Token JWT e ingressar na sala.
   */
  @Post('teleorientation/:appointmentId/join/vet')
  @UseGuards(JwtAuthGuard, RBACGuard)
  @Roles(UserRole.VET_FIELD, UserRole.VET_RESPONSAVEL_TECNICO)
  async joinRoomVet(
    @Param('appointmentId') appointmentId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return await this.teleorientationService.getRoomAccess(appointmentId, user.userId, true);
  }
}
