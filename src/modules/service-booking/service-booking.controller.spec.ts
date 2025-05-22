import { Test, TestingModule } from '@nestjs/testing';
import { ServiceBookingController } from './service-booking.controller';
import { ServiceBookingService } from './service-booking.service';

describe('ServiceBookingController', () => {
  let controller: ServiceBookingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServiceBookingController],
      providers: [ServiceBookingService],
    }).compile();

    controller = module.get<ServiceBookingController>(ServiceBookingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
