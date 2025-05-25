import { Test, TestingModule } from '@nestjs/testing';
import { ManageBookingsService } from './manage-bookings.service';

describe('ManageBookingsService', () => {
  let service: ManageBookingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ManageBookingsService],
    }).compile();

    service = module.get<ManageBookingsService>(ManageBookingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
