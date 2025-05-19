import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { UpdateUserDashboardDto } from './dto/update-user-dashboard.dto';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import appConfig from 'src/config/app.config';
import { existsSync, unlinkSync } from 'fs';

@Injectable()
export class UserDashboardService {
  constructor(private prisma: PrismaService) {}

  async update(
    userId: string,
    updateUserDashboardDto: UpdateUserDashboardDto,
    avatar?: Express.Multer.File,
  ) {
    try {
      const updateData: any = { ...updateUserDashboardDto };
      
      // Add avatar filename if file was uploaded
      if (avatar) {
        updateData.avatar = avatar.filename;
      }

      // Hash password if provided
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          phone_number: true,
          address: true,
          email: true,
          avatar: true,
        },
      });

      return {
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update profile',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  

    async deleteAvatar(userId: string) {
      try {
        // Get current user to find avatar filename
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { avatar: true },
        });
    
        if (user?.avatar) {
          // Delete physical file
          const avatarPath = appConfig().storageUrl.rootUrl + appConfig().storageUrl.avatar + user.avatar;
          if (existsSync(avatarPath)) {
            unlinkSync(avatarPath);
          }
    
          // Update user record to remove avatar reference
          await this.prisma.user.update({
            where: { id: userId },
            data: { avatar: null },
          });
        }
    
        return {
          success: true,
          message: 'Profile picture deleted successfully',
        };
      } catch (error) {
        throw new HttpException(
          error.message || 'Failed to delete profile picture',
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }

