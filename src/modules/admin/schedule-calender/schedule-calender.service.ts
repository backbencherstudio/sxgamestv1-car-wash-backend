import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ScheduleCalenderService {
  constructor(private prisma: PrismaService) {}

  async getSchedule(month: string, view: 'weekly' | 'monthly') {
    // Parse month string (e.g., "May 2025")
    const [monthName, year] = month.split(' ');
    const monthIndex = new Date(`${monthName} 1, 2000`).getMonth();
    
    // Create start and end dates for the month
    const startDate = new Date(parseInt(year), monthIndex, 1);
    const endDate = new Date(parseInt(year), monthIndex + 1, 0);

    const bookings = await this.prisma.serviceBooking.findMany({
      where: {
        deleted_at: null,
        status: 'ongoing',  // Add status filter for ongoing bookings
        schedule_datetime: {
          gte: startDate,
          lte: endDate
        }
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
        user: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        schedule_datetime: 'asc'
      }
    });

    // Format the data for calendar view
    const formattedBookings = bookings.map(booking => ({
      id: booking.id,
      title: booking.service_type,
      startTime: booking.schedule_time,
      date: booking.schedule_date,
      location: booking.location,
      customerName: booking.user.name,
      serviceType: booking.service_timing,
      status: booking.status
    }));

    return {
      status: true,
      message: 'Schedule retrieved successfully',
      data: {
        view,
        month,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        bookings: formattedBookings
      }
    };
  }
}
