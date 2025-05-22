import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFiles,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { ServiceProviderService } from './service-provider.service';
import { CreateServiceProviderDto } from './dto/create-service-provider.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import appConfig from '../../config/app.config';
import { existsSync, mkdirSync } from 'fs';

@ApiTags('provider/service-provider')
@Controller('provider/service-provider')
export class ServiceProviderController {
  constructor(private readonly serviceProviderService: ServiceProviderService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a service provider' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(
      [                
        { name: 'profile_picture', maxCount: 1 },
        { name: 'license_front', maxCount: 1 },
        { name: 'license_back', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: (req, file, cb) => {
            let path = appConfig().storageUrl.rootUrl;
            if (file.fieldname === 'profile_picture') {
              path += appConfig().storageUrl.avatar;
            } else {
              path += appConfig().storageUrl.license;
            }
            // Create directory if it doesn't exist
            if (!existsSync(path)) {
              mkdirSync(path, { recursive: true });
            }
            cb(null, path);
          },
          filename: (req, file, cb) => {
            const randomName = Array(32)
              .fill(null)
              .map(() => Math.round(Math.random() * 16).toString(16))
              .join('');
            cb(null, `${randomName}${file.originalname}`);
          },
        }),
      },
    ),
  )
  async create(
    @Req() req,
    @Body() createServiceProviderDto: CreateServiceProviderDto,
    @UploadedFiles()
    files: {
      profile_picture?: Express.Multer.File[];
      license_front?: Express.Multer.File[];
      license_back?: Express.Multer.File[];
    },
  ) {
    try {
      // No need to spread and redefine the same properties
      return await this.serviceProviderService.create(
        req.user.userId,
        createServiceProviderDto,
        files?.profile_picture?.[0],
        files?.license_front?.[0],
        files?.license_back?.[0],
      );
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
