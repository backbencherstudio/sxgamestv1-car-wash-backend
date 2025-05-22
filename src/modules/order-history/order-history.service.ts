import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OrderHistoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    try {
      const bookings = await this.prisma.serviceBooking.findMany({
        where: {
          user_id: userId,
          deleted_at: null,
        },
        orderBy: {
          created_at: 'desc',
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
        },
      });

      return {
        success: true,
        message: 'Service booking history retrieved successfully',
        data: bookings,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve service booking history',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
