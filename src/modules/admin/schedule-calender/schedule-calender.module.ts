import { Module } from '@nestjs/common';
import { ScheduleCalenderService } from './schedule-calender.service';
import { ScheduleCalenderController } from './schedule-calender.controller';

@Module({
  controllers: [ScheduleCalenderController],
  providers: [ScheduleCalenderService],
})
export class ScheduleCalenderModule {}
