import { PartialType } from '@nestjs/swagger';
import { CreateManageBookingDto } from './create-manage-booking.dto';

export class UpdateManageBookingDto extends PartialType(CreateManageBookingDto) {}
