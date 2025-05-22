import { Injectable } from '@nestjs/common';
import { CreateServiceBookingDto } from './dto/create-service-booking.dto';

@Injectable()
export class ServiceBookingService {
  create(createServiceBookingDto: CreateServiceBookingDto) {
    return 'This action adds a new serviceBooking';
  }

}
