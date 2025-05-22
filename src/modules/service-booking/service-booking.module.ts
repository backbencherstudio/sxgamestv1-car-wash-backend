import { Module } from '@nestjs/common';
import { ServiceBookingService } from './service-booking.service';
import { ServiceBookingController } from './service-booking.controller';

@Module({
  controllers: [ServiceBookingController],
  providers: [ServiceBookingService],
})
export class ServiceBookingModule {}
