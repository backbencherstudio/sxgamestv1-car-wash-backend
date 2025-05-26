import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateServiceBookingDto } from './dto/create-service-booking.dto';

@Injectable()
export class ServiceBookingService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createServiceBookingDto: CreateServiceBookingDto) {
    try {
      const dateTime = new Date(`${createServiceBookingDto.schedule_date}T${createServiceBookingDto.schedule_time}:00`);

      const booking = await this.prisma.serviceBooking.create({
        data: {
          service_type: createServiceBookingDto.service_type,
          service_timing: createServiceBookingDto.service_timing,
          location: createServiceBookingDto.location,
          schedule_date: createServiceBookingDto.schedule_date,
          schedule_time: createServiceBookingDto.schedule_time,
          schedule_datetime: dateTime,
          status: 'pending',
          user_id: userId,
        },
      });

      return {
        success: true,
        message: 'Service booking created successfully',
        data: booking,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create service booking',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getBookedDates() {
      const bookedSlots = await this.prisma.serviceBooking.findMany({
        where: {
          deleted_at: null,
          status: {
            in: ['ongoing']
          },
          schedule_datetime: {
            gte: new Date() // Only get current and future bookings
          }
        },
        select: {
          schedule_date: true,
          schedule_time: true,
          schedule_datetime: true,
          service_type: true,
          service_timing: true
        },
        orderBy: {
          schedule_datetime: 'asc'
        }
      });
  
      return {
        status: true,
        message: 'Booked dates retrieved successfully',
        data: bookedSlots.map(slot => ({
          date: slot.schedule_date,
          time: slot.schedule_time,
          datetime: slot.schedule_datetime,
          serviceType: slot.service_type,
          serviceTiming: slot.service_timing
        }))
      };
    }
}
