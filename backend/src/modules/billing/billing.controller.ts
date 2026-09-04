import { Controller, Post, Get, Body, HttpCode, HttpStatus, Param, UseGuards } from '@nestjs/common';
import { SubscriptionsService, AsaasWebhookPayload, CreateSubscriptionDto } from './services/subscriptions.service';
import { VetPayoutEngineService } from './services/vet-payout-engine.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RBACGuard } from '../../common/guards/rbac.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../database/enums';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@Controller('billing')
export class BillingController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly vetPayoutEngineService: VetPayoutEngineService,
  ) {}

  /**
   * Inicia ou altera a assinatura do plano para o tutor autenticado
   */
  @Post('subscriptions')
  @UseGuards(JwtAuthGuard)
  async createSubscription(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return await this.subscriptionsService.createSubscription(user.userId, dto);
  }

  /**
   * Consulta o plano e status de assinatura do tutor autenticado
   */
  @Get('subscriptions/me')
  @UseGuards(JwtAuthGuard)
  async getMySubscription(@CurrentUser() user: CurrentUserPayload) {
    return await this.subscriptionsService.getTutorSubscription(user.userId);
  }

  /**
   * Recebe webhooks do Asaas para gerenciar o ciclo de vida da assinatura.
   */
  @Post('webhooks/gateway')
  @HttpCode(HttpStatus.OK)
  async handleGatewayWebhook(@Body() payload: AsaasWebhookPayload) {
    await this.subscriptionsService.processWebhook(payload);
    return { received: true };
  }

  /**
   * Endpoint de testes/homologação para forçar a geração de repasse de um agendamento já concluído.
   */
  @Post('payouts/calculate/:appointmentId')
  @UseGuards(JwtAuthGuard, RBACGuard)
  @Roles(UserRole.ADMIN_GERAL)
  async forceCalculatePayout(@Param('appointmentId') appointmentId: string) {
    return await this.vetPayoutEngineService.calculateAndSchedulePayout(appointmentId);
  }
}
