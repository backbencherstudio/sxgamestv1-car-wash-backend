import { PartialType } from '@nestjs/swagger';
import { CreateServiceBookingDto } from './create-service-booking.dto';

export class UpdateServiceBookingDto extends PartialType(CreateServiceBookingDto) {}
