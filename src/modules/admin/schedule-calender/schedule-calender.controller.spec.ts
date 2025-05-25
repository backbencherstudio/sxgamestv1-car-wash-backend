import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleCalenderController } from './schedule-calender.controller';
import { ScheduleCalenderService } from './schedule-calender.service';

describe('ScheduleCalenderController', () => {
  let controller: ScheduleCalenderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScheduleCalenderController],
      providers: [ScheduleCalenderService],
    }).compile();

    controller = module.get<ScheduleCalenderController>(ScheduleCalenderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
