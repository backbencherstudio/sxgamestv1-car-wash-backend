import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ScheduleCalenderService {
  constructor(private prisma: PrismaService) {}

  async getSchedule(month: string, view: 'weekly' | 'today') {
    // Parse month string (e.g., "May 2025")
    const [monthName, year] = month.split(' ');
    const monthIndex = new Date(`${monthName} 1, 2000`).getMonth();
    
    let startDate: Date;
    let endDate: Date;

    if (view === 'today') {
      // For today's view, set start and end to current day
      const today = new Date();
      startDate = new Date(today);
      startDate.setHours(0, 0, 0, 0);
      
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
    } else if (view === 'weekly') {
      // For weekly view, get the current week's start and end dates
      const today = new Date();
      const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday, etc.
      
      // Calculate start of the week (Sunday)
      startDate = new Date(today);
      startDate.setDate(today.getDate() - currentDay);
      startDate.setHours(0, 0, 0, 0);
      
      // Calculate end of the week (Saturday)
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    }

    const bookings = await this.prisma.serviceBooking.findMany({
      where: {
        deleted_at: null,
        status: 'ongoing',
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
