import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { CheckInService } from './checkin.service';
import { ScanCheckInDto } from './dto/checkin.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Roles(Role.BENDAHARA, Role.SUPER_ADMIN)
@Controller('checkin')
export class CheckInController {
  constructor(private readonly checkInService: CheckInService) {}

  @Post('scan')
  async scanCheckIn(
    @CurrentUser('id') staffId: string,
    @Body() dto: ScanCheckInDto,
  ) {
    const result = await this.checkInService.processCheckIn(staffId, dto);
    return result;
  }

  @Get('live-log')
  async getLiveLog(@Query('limit') limit = '50') {
    const logs = await this.checkInService.getLiveCheckInLogs(parseInt(limit, 10) || 50);
    return {
      success: true,
      count: logs.length,
      data: logs,
    };
  }
}
