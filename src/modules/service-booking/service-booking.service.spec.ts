import { Test, TestingModule } from '@nestjs/testing';
import { ServiceBookingService } from './service-booking.service';

describe('ServiceBookingService', () => {
  let service: ServiceBookingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServiceBookingService],
    }).compile();

    service = module.get<ServiceBookingService>(ServiceBookingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
