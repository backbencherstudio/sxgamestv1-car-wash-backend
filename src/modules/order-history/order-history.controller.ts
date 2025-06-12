import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { OrderHistoryService } from './order-history.service';
import { CreateOrderHistoryDto } from './dto/create-order-history.dto';
import { UpdateOrderHistoryDto } from './dto/update-order-history.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateReviewDto } from './dto/create-review.dto';

@Controller('order-history')
@UseGuards(JwtAuthGuard)
@ApiTags('order-history')
@ApiBearerAuth()
export class OrderHistoryController {
  constructor(private readonly orderHistoryService: OrderHistoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get user\'s service booking history' })
  async findAll(@Req() req) {
    try {
      return await this.orderHistoryService.findAll(req.user.userId);
    } catch (error) {
      throw new Error(error);
    }
  }

  @Post(':bookingId/review')
  @ApiOperation({ summary: 'Create a review for a service booking' })
  async createReview(
    @Req() req,
    @Param('bookingId') bookingId: string,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    try {
      return await this.orderHistoryService.createReview(
        req.user.userId,
        bookingId,
        createReviewDto,
      );
    } catch (error) {
      throw new Error(error);
    }
  }

  @Get('reviews')
  @ApiOperation({ summary: 'Get all reviews with user details' })
  async getAllReviews() {
    try {
      return await this.orderHistoryService.getAllReviewsWithUserDetails();
    } catch (error) {
      throw new Error(error);
    }
  }
}
