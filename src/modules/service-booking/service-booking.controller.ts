import { Controller, Post, Body, UseGuards, Req, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ServiceBookingService } from './service-booking.service';
import { CreateServiceBookingDto } from './dto/create-service-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('service-booking')
@Controller('service-booking')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ServiceBookingController {
  constructor(private readonly serviceBookingService: ServiceBookingService) {}

  @Post("/scheduled")
  @ApiOperation({ summary: 'Book a service schedule' })
  async create(@Req() req, @Body() createServiceBookingDto: CreateServiceBookingDto) {
    try {
      return await this.serviceBookingService.create(req.user.userId, createServiceBookingDto);
    } catch (error) {
      throw new Error(error);
    }
  }

  @Post("/instant")
  @ApiOperation({ summary: 'Book a service For Instant' })
  async createInstant(@Req() req, @Body() createServiceBookingDto: CreateServiceBookingDto) {
    try {
      return await this.serviceBookingService.create(req.user.userId, createServiceBookingDto);
    } catch (error) {
      throw new Error(error);
    }
  }

  @Get('booked-dates')
  @ApiOperation({ summary: 'Get all booked dates and times' })
  async getBookedDates() {
    try {
      return await this.serviceBookingService.getBookedDates();
    } catch (error) {
      throw new Error(error);
    }
  }
}
