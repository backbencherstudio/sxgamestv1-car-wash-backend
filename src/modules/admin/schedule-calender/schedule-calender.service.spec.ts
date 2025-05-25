import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleCalenderService } from './schedule-calender.service';

describe('ScheduleCalenderService', () => {
  let service: ScheduleCalenderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScheduleCalenderService],
    }).compile();

    service = module.get<ScheduleCalenderService>(ScheduleCalenderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
