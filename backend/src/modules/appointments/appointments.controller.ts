import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  ParseFloatPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ColdChainService } from './services/cold-chain.service';
import { AppointmentsService } from './services/appointments.service';
import { CreateAppointmentDto, UpdateAppointmentStatusDto } from './dto/appointment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RBACGuard } from '../../common/guards/rbac.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppointmentStatus, UserRole } from '../../database/enums';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(
    private readonly coldChainService: ColdChainService,
    private readonly appointmentsService: AppointmentsService,
  ) {}

  /**
   * Solicitação de visita domiciliar
   */
  @Post()
  async createAppointment(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateAppointmentDto,
  ) {
    return await this.appointmentsService.createAppointment(user.userId, dto);
  }

  /**
   * Listagem de agendamentos da agenda
   */
  @Get()
  async getAppointments(
    @CurrentUser() user: CurrentUserPayload,
    @Query('status') status?: AppointmentStatus,
    @Query('date') date?: string,
    @Query('pet_id') pet_id?: string,
  ) {
    return await this.appointmentsService.findAppointments(user, { status, date, pet_id });
  }

  /**
   * Atualização de status da visita (a caminho, iniciado, concluído, cancelado)
   */
  @Patch(':id/status')
  async updateStatus(
    @Param('id') appointmentId: string,
    @Body() dto: UpdateAppointmentStatusDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return await this.appointmentsService.updateStatus(appointmentId, dto.status, user);
  }

  /**
   * Endpoint de validação da Trava Térmica pelo app do Veterinário
   */
  @Post(':id/cold-chain')
  @UseGuards(RBACGuard)
  @Roles(UserRole.VET_FIELD, UserRole.ADMIN_GERAL)
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
