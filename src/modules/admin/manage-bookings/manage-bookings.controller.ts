import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ManageBookingsService } from './manage-bookings.service';

@Controller('admin/manage-bookings')
export class ManageBookingsController {
  constructor(private readonly manageBookingsService: ManageBookingsService) {}

  @Get("allwork")
  findAll() {
    try {
      return this.manageBookingsService.findAll();
    } catch (error) {
        return {
          status: false,
          message: error.message,
        }
    }
  }

  @Get("ongoing")
  getOngoingWorks() {
    try {
      return this.manageBookingsService.getOngoingWorks();
    } catch (error) {
      return {
        status: false,
        message: error.message,
      }
    }
  }


  @Get('completed-bookings')
  async getCompletedBookings() {
    try {
      return this.manageBookingsService.getCompletedBookings();
    } catch (error) {
      return {
        status: false,
        message: error.message,
      }
    }
  }

  @Patch('completed-bookings/:id')
  async updateCompletedStatus(
    @Param('id') id: string,
    @Body('action') action: 'completed' | 'cancelled'
  ) {
    try {
      console.log(action)
      return this.manageBookingsService.updateCompletedStatus(id, action);
    } catch (error) {
      return {
        status: false,
        message: error.message,
      }
    }
  }


}
