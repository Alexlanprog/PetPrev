import { Controller, Post, Body, HttpCode, HttpStatus, Param, UseGuards } from '@nestjs/common';
import { SubscriptionsService, AsaasWebhookPayload } from './services/subscriptions.service';
import { VetPayoutEngineService } from './services/vet-payout-engine.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RBACGuard } from '../../common/guards/rbac.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../database/enums';

@Controller('billing')
export class BillingController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly vetPayoutEngineService: VetPayoutEngineService,
  ) {}

  /**
   * Recebe webhooks do Asaas para gerenciar o ciclo de vida da assinatura.
   * Em produção, deve haver verificação de assinatura/token no header para garantir origem.
   */
  @Post('webhooks/gateway')
  @HttpCode(HttpStatus.OK)
  async handleGatewayWebhook(@Body() payload: AsaasWebhookPayload) {
    // Retorna OK rapidamente e processa o webhook
    await this.subscriptionsService.processWebhook(payload);
    return { received: true };
  }

  /**
   * Endpoint de testes/homologação ou acionado por um cron interno 
   * para forçar a geração de repasse de um agendamento já concluído.
   * Protegido para Administradores.
   */
  @Post('payouts/calculate/:appointmentId')
  @UseGuards(JwtAuthGuard, RBACGuard)
  @Roles(UserRole.ADMIN_GERAL)
  async forceCalculatePayout(@Param('appointmentId') appointmentId: string) {
    return await this.vetPayoutEngineService.calculateAndSchedulePayout(appointmentId);
  }
}
