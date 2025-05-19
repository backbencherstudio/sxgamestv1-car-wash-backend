import { Controller, Get, Post, Body, Patch, Delete, UseGuards, Req, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import appConfig from '../../config/app.config';
import { existsSync, mkdirSync } from 'fs';
import { UserDashboardService } from './user-dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateUserDashboardDto } from './dto/update-user-dashboard.dto';

@ApiTags('user-dashboard')
@Controller('user-dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserDashboardController {
  constructor(private readonly userDashboardService: UserDashboardService) {}

  @Patch('profile/update')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        phone_number: { type: 'string' },
        password: { type: 'string' },
        address: { type: 'string' },
        avatar: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const path = appConfig().storageUrl.rootUrl + appConfig().storageUrl.avatar;
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
  async update(
    @Req() req,
    @Body() updateUserDashboardDto: UpdateUserDashboardDto,
    @UploadedFile() avatar?: Express.Multer.File,
  ) {
    try {
      return await this.userDashboardService.update(
        req.user.userId,
        updateUserDashboardDto,
        avatar,
      );
    } catch (error) {
      throw new Error(error);
    }
  }

  @Delete('profile/delete-avatar')
  async deleteAvatar(@Req() req) {
    try {
      return await this.userDashboardService.deleteAvatar(req.user.userId);
    } catch (error) {
      throw new Error(error);
    }
  }
}
