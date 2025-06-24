import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async create(createServiceDto: CreateServiceDto, additionalImage?: Express.Multer.File) {
    try {
      const service = await this.prisma.service.create({
        data: {
          name: createServiceDto.service_name,
          category: createServiceDto.service_category,
          location: createServiceDto.location,
          available_time: createServiceDto.available_time,
          team_size: Number(createServiceDto.team_size),
          description: createServiceDto.descriptions,
          is_mobile: Boolean(createServiceDto.mobile),
          is_garage: Boolean(createServiceDto.garage),
          image: additionalImage?.filename || null,
          status: 1,
        },
      });

      return {
        success: true,
        message: 'Service created successfully',
        data: service,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create service',
        HttpStatus.BAD_REQUEST,
      );
    }

  }
  async findAll() {
    try {
      const services = await this.prisma.service.findMany({
        where: {
          deleted_at: null,
        },
        orderBy: {
          created_at: 'desc',
        },
      });
  
      return {
        success: true,
        message: 'Services retrieved successfully',
        data: services.map(ser =>({
          ...ser,
          imageUrl: ser.image ? `${process.env.APP_URL}/storage/services/${ser.image}` : null
        })),
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve services',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findOne(id: string) {
    try {
      const service = await this.prisma.service.findUnique({
        where: { id },
      });
  
      if (!service) {
        throw new HttpException('Service not found', HttpStatus.NOT_FOUND);
      }
  
      return {
        success: true,
        message: 'Service retrieved successfully',
        data: {
          ...service,
          imageUrl: service.image
            ? `${process.env.APP_URL}/storage/services/${service.image}`
            : null,
        },
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve service',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
  
}