import { Controller, Get, Query } from '@nestjs/common';
import { ScheduleCalenderService } from './schedule-calender.service';

@Controller('admin/schedule-calender')
export class ScheduleCalenderController {
  constructor(private readonly scheduleCalenderService: ScheduleCalenderService) {}

  @Get()
  async getSchedule(
    @Query('month') month: string, // e.g., "May 2025"
    @Query('view') view: 'weekly' | 'today' = 'weekly'
  ) {
    try {
      return await this.scheduleCalenderService.getSchedule(month, view);
    } catch (error) {
      return {
        status: false,
        message: error.message,
      };
    }
  }
}
