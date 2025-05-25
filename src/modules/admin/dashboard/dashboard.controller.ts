import { Controller, Get, UseGuards, Query, Patch, Param, Body } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { Roles } from 'src/common/guard/role/roles.decorator';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { Role } from 'src/common/guard/role/role.enum';

@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async findAll(@Query('period') period?: 'yearly' | 'monthly') {
    try {
      return this.dashboardService.findAll(period);
    } catch (error) {
      return {
        status: false,
        message: error.message,
      }
    }
  }

  @Patch('admin/service-booking/:id')
  async updateServiceStatus(
    @Param('id') id: string,
    @Body('action') action: 'accept' | 'reject'
  ) {
    try {
      return this.dashboardService.updateServiceStatus(id, action);
    } catch (error) {
      return {
        status: false,
        message: error.message,
      }
    }
  }
}
