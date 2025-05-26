import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { Role } from 'src/common/guard/role/role.enum';
import { Roles } from 'src/common/guard/role/roles.decorator';

@Controller('admin/profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async admin(@Req() req) {
    try {
      const user_id = req.user.userId;
      const response = await this.profileService.me(user_id);
      return response;
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch user details',
      };
    }
  }

  @Patch('edit-profile')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'license_front', maxCount: 1 },
    { name: 'license_back', maxCount: 1 },
    { name: 'avatar', maxCount: 1 },
    { name: 'banner', maxCount: 1 }  // Add banner upload
  ]))
  async updateProfile(
    @Req() req,
    @Body() updateData: {
      name: string;
      email: string;
      phone: string;
      business_location: string;
      address: string;
      date_of_birth: string;
      about: string;
    },
    @UploadedFiles() files: {
      license_front?: Express.Multer.File[];
      license_back?: Express.Multer.File[];
      avatar?: Express.Multer.File[];
      banner?: Express.Multer.File[];  // Add banner type
    }
  ) {
    try {
      const userId = req.user.userId;
      return await this.profileService.updateProfile(userId, updateData, files);
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}
