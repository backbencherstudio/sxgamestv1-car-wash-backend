import { Module } from '@nestjs/common';
import { UserDashboardService } from './user-dashboard.service';
import { UserDashboardController } from './user-dashboard.controller';

@Module({
  controllers: [UserDashboardController],
  providers: [UserDashboardService],
})
export class UserDashboardModule {}
