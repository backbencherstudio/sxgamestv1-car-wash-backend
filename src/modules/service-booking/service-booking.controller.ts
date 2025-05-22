import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ServiceBookingService } from './service-booking.service';
import { CreateServiceBookingDto } from './dto/create-service-booking.dto';
import { UpdateServiceBookingDto } from './dto/update-service-booking.dto';

@Controller('service-booking')
export class ServiceBookingController {
  constructor(private readonly serviceBookingService: ServiceBookingService) {}

  @Post()
  create(@Body() createServiceBookingDto: CreateServiceBookingDto) {
    try{
      return this.serviceBookingService.create(createServiceBookingDto);
    }catch(error){
      return error;
    }
  }

}
