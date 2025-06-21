import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { SojebStorage } from '../../common/lib/Disk/SojebStorage';
import appConfig from '../../config/app.config';

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
          review: {
            select: {
              id: true,
              rating: true,
              description: true,
              created_at: true,
            },
          },
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

  async createReview(userId: string, bookingId: string, createReviewDto: CreateReviewDto) {
    try {
      // Check if booking exists and belongs to user
      const booking = await this.prisma.serviceBooking.findFirst({
        where: {
          id: bookingId,
          user_id: userId,
          deleted_at: null,
        },
      });

      if (!booking) {
        throw new HttpException('Booking not found', HttpStatus.NOT_FOUND);
      }

      // Check if review already exists
      const existingReview = await this.prisma.review.findUnique({
        where: {
          booking_id: bookingId,
        },
      });

      if (existingReview) {
        return 'Review already exists for this booking';
      }

      // Create review
      const review = await this.prisma.review.create({
        data: {
          rating: createReviewDto.rating,
          description: createReviewDto.description,
          booking_id: bookingId,
          user_id: userId,
        },
      });

      return {
        success: true,
        message: 'Review created successfully',
        data: review,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create review',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getReviewsWithUserDetails(bookingId: string) {
    try {
      const reviews = await this.prisma.review.findMany({
        where: {
          booking_id: bookingId,
          deleted_at: null,
        },
        select: {
          id: true,
          rating: true,
          description: true,
          created_at: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              phone_number: true,
            },
          },
          booking: {
            select: {
              id: true,
              service_type: true,
              service_timing: true,
              location: true,
              schedule_date: true,
              schedule_time: true,
              status: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      // Format the response to include avatar URL if exists
      const formattedReviews = reviews.map(review => {
        if (review.user.avatar) {
          review.user['avatar_url'] = SojebStorage.url(
            appConfig().storageUrl.avatar + review.user.avatar,
          );
        }
        return review;
      });

      return {
        success: true,
        message: 'Reviews retrieved successfully',
        data: formattedReviews,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve reviews',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getAllReviewsWithUserDetails() {
    try {
      const reviews = await this.prisma.review.findMany({
        where: {
          deleted_at: null,
        },
        select: {
          id: true,
          rating: true,
          description: true,
          created_at: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              phone_number: true,
            },
          },
          booking: {
            select: {
              id: true,
              service_type: true,
              service_timing: true,
              location: true,
              schedule_date: true,
              schedule_time: true,
              status: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      // Format the response to include avatar URL if exists
      const formattedReviews = reviews.map(review => {
        if (review.user.avatar) {
          review.user['avatar_url'] = SojebStorage.url(
            appConfig().storageUrl.avatar + review.user.avatar,
          );
        }
        return review;
      });

      return {
        success: true,
        message: 'Reviews retrieved successfully',
        data: formattedReviews,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve reviews',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
