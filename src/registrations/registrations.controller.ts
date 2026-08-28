import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { RegistrationsService } from './registrations.service';
import { CreateIndividualRegistrationDto } from './dto/create-individual.dto';
import { CreateTeamRegistrationDto } from './dto/create-team.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, RegistrationStatus } from '@prisma/client';

@Controller('registrations')
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Roles(Role.PESERTA)
  @Post('individual')
  async createIndividual(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateIndividualRegistrationDto,
  ) {
    const data = await this.registrationsService.createIndividual(userId, dto);
    return {
      success: true,
      message: 'Pendaftaran individu berhasil dibuat!',
      data,
    };
  }

  @Roles(Role.PESERTA)
  @Post('team')
  async createTeam(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTeamRegistrationDto,
  ) {
    const data = await this.registrationsService.createTeam(userId, dto);
    return {
      success: true,
      message: 'Pendaftaran tim/beregu berhasil dibuat!',
      data,
    };
  }

  @Roles(Role.BENDAHARA, Role.SUPER_ADMIN)
  @Get()
  async listAll(
    @Query('search') search?: string,
    @Query('status') status?: RegistrationStatus,
    @Query('branchId') branchId?: string,
    @Query('page') page = '1',
    @Query('perPage') perPage = '25',
  ) {
    const data = await this.registrationsService.listAllRegistrations(
      search,
      status,
      branchId,
      parseInt(page, 10) || 1,
      parseInt(perPage, 10) || 25,
    );
    return { success: true, ...data };
  }

  @Get('my')
  async getMyRegistrations(@CurrentUser('id') userId: string) {
    const data = await this.registrationsService.getUserRegistrations(userId);
    return {
      success: true,
      data,
    };
  }

  @Get(':id')
  async getRegistrationDetail(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    const data = await this.registrationsService.getRegistrationById(id, userId, role);
    return {
      success: true,
      data,
    };
  }
}
