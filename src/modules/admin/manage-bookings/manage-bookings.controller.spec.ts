import { Test, TestingModule } from '@nestjs/testing';
import { ManageBookingsController } from './manage-bookings.controller';
import { ManageBookingsService } from './manage-bookings.service';

describe('ManageBookingsController', () => {
  let controller: ManageBookingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ManageBookingsController],
      providers: [ManageBookingsService],
    }).compile();

    controller = module.get<ManageBookingsController>(ManageBookingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
