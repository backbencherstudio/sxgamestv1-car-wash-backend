import { PartialType } from '@nestjs/swagger';
import { CreateScheduleCalenderDto } from './create-schedule-calender.dto';

export class UpdateScheduleCalenderDto extends PartialType(CreateScheduleCalenderDto) {}
