import { Test, TestingModule } from '@nestjs/testing';
import { UserDashboardController } from './user-dashboard.controller';
import { UserDashboardService } from './user-dashboard.service';

describe('UserDashboardController', () => {
  let controller: UserDashboardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserDashboardController],
      providers: [UserDashboardService],
    }).compile();

    controller = module.get<UserDashboardController>(UserDashboardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
