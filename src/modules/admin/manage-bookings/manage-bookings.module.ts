import { Module } from '@nestjs/common';
import { ManageBookingsService } from './manage-bookings.service';
import { ManageBookingsController } from './manage-bookings.controller';

@Module({
  controllers: [ManageBookingsController],
  providers: [ManageBookingsService],
})
export class ManageBookingsModule {}
