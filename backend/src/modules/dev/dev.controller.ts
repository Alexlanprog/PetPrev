import { Controller, Post, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DevService } from './dev.service';

@ApiTags('Desenvolvimento e Demonstração')
@Controller('dev')
export class DevController {
  constructor(private readonly devService: DevService) {}

  @Post('seed')
  @ApiOperation({
    summary: 'Carga completa do cenário de demonstração',
    description:
      'Popula o banco com 1 Tutor (Ana Ribeiro), 2 Pets (Thor e Mia), 1 Veterinário com CRMV, agendamentos, prontuários para RT e retorna tokens de teste prontos.',
  })
  async seedDemo() {
    return await this.devService.seedDemoScenario();
  }
}
