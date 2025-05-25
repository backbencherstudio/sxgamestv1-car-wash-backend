import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ManageBookingsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const bookings = await this.prisma.serviceBooking.findMany({
      where: {
        deleted_at: null
      },
      select: {
        id: true,
        service_type: true,
        service_timing: true,
        location: true,
        schedule_date: true,
        schedule_time: true,
        schedule_datetime: true,
        status: true,
        created_at: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone_number: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return {
      status: true,
      message: 'Service bookings retrieved successfully',
      data: bookings
    };
  }

  async getOngoingWorks() {
    const ongoingBookings = await this.prisma.serviceBooking.findMany({
      where: {
        deleted_at: null,
        status: 'ongoing'
      },
      select: {
        id: true,
        service_type: true,
        service_timing: true,
        location: true,
        schedule_date: true,
        schedule_time: true,
        schedule_datetime: true,
        status: true,
        created_at: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone_number: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return {
      status: true,
      message: 'Ongoing service bookings retrieved successfully',
      data: ongoingBookings
    };
  }

  async getCompletedBookings() {
    const completedBookings = await this.prisma.serviceBooking.findMany({
      where: {
        status: 'completed',
        deleted_at: null
      },
      select: {
        id: true,
        service_type: true,
        service_timing: true,
        location: true,
        schedule_date: true,
        schedule_time: true,
        schedule_datetime: true,
        status: true,
        created_at: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone_number: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return {
      status: true,
      message: 'Completed service bookings retrieved successfully',
      data: completedBookings
    };
  }
}
