import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@Controller('pets')
@UseGuards(JwtAuthGuard)
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @Post()
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreatePetDto,
  ) {
    return await this.petsService.create(user.userId, dto);
  }

  @Get()
  async findAll(@CurrentUser() user: CurrentUserPayload) {
    return await this.petsService.findAllByTutor(user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.petsService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePetDto,
  ) {
    return await this.petsService.update(id, dto);
  }
}
