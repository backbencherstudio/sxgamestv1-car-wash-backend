import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateServiceProviderDto } from './dto/create-service-provider.dto';

@Injectable()
export class ServiceProviderService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    createServiceProviderDto: CreateServiceProviderDto,
    profilePicture: Express.Multer.File | undefined,
    licenseFront: Express.Multer.File | undefined,
    licenseBack: Express.Multer.File | undefined,
  ) {
    try {
      // Check if user exists and is a provider
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || user.type !== 'provider') {
        throw new HttpException(
          'User must be a provider type',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Check if provider details already exist
      const existingProvider = await this.prisma.serviceProvider.findUnique({
        where: { user_id: userId },
      });

      if (existingProvider) {
        throw new HttpException(
          'Service provider details already exist',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Create service provider data
      const serviceProvider = await this.prisma.serviceProvider.create({
        data: {
          business_name: createServiceProviderDto.business_name,
          business_number: createServiceProviderDto.business_number,
          profile_picture: profilePicture?.filename,
          license_front: licenseFront?.filename,
          license_back: licenseBack?.filename,
          nid_number: createServiceProviderDto.nid_number,
          license_number: createServiceProviderDto.license_number,
          date_of_birth: new Date(createServiceProviderDto.date_of_birth),
          business_location: createServiceProviderDto.business_location,
          permanent_address: createServiceProviderDto.permanent_address,
          user_id: userId,
        },
      });

      return {
        success: true,
        message: 'Service provider details added successfully',
        data: serviceProvider,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create service provider',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
