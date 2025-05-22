import { Controller, Post, Body, UseInterceptors, UploadedFile, UseGuards, Get, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import appConfig from '../../../config/app.config';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { Roles } from 'src/common/guard/role/roles.decorator';
import { Role } from 'src/common/guard/role/role.enum';

@ApiTags('admin/services')
@Controller('admin/services')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}
  
  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: CreateServiceDto,
  })
  @UseInterceptors(
    FileInterceptor('additional_image', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const path = appConfig().storageUrl.rootUrl + '/services/';
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
    }),
  )
  async create(
    @Body() createServiceDto: CreateServiceDto,
    @UploadedFile() additionalImage?: Express.Multer.File,
  ) {
    try {
      // console.log(createServiceDto, additionalImage)
      return await this.servicesService.create(createServiceDto, additionalImage);
    } catch (error) {
      throw new Error(error);
    }
  }

  @Get()
  
  
  @ApiOperation({ summary: 'Get all services' })
  async findAll() {
    try {
      return await this.servicesService.findAll();
    } catch (error) {
      throw new Error(error);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service by ID' })
  @ApiParam({ name: 'id', type: 'string' })
  async findOne(@Param('id') id: string) {
    try {
      return await this.servicesService.findOne(id);
    } catch (error) {
      throw new Error(error);
    }
  }
}
