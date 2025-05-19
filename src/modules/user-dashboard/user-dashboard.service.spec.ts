import { Test, TestingModule } from '@nestjs/testing';
import { UserDashboardService } from './user-dashboard.service';

describe('UserDashboardService', () => {
  let service: UserDashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserDashboardService],
    }).compile();

    service = module.get<UserDashboardService>(UserDashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
