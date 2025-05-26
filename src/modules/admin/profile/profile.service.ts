import { Injectable } from '@nestjs/common';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from 'src/mail/mail.service';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';
import appConfig from 'src/config/app.config';

@Injectable()
export class ProfileService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async me(userId: string) {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          id: userId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          first_name: true,
          last_name: true,
          avatar: true,
          phone_number: true,
          country: true,
          state: true,
          city: true,
          address: true,
          zip_code: true,
          gender: true,
          date_of_birth: true,
          type: true,
          created_at: true,
          updated_at: true,
          status: true,
          availability: true,
          service_provider: {
            select: {
              business_name: true,
              business_number: true,
              profile_picture: true,
              license_front: true,
              license_back: true,
              nid_number: true,
              license_number: true,
              date_of_birth: true,
              business_location: true,
              permanent_address: true
            }
          },
          roles: {
            select: {
              id: true,
              name: true,
              title: true
            }
          }
        },
      });

      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Handle avatar URL
      if (user.avatar) {
        user['avatar_url'] = SojebStorage.url(
          appConfig().storageUrl.avatar + user.avatar,
        );
      }

      return {
        success: true,
        data: user,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async updateProfile(
      userId: string,
      updateData: {
        name: string;
        email: string;
        phone: string;
        business_location: string;
        address: string;
        date_of_birth: string;
        about: string;
      },
      files: {
        license_front?: Express.Multer.File[];
        license_back?: Express.Multer.File[];
        avatar?: Express.Multer.File[];
        banner?: Express.Multer.File[];  // Add banner type
      }
    ) {
      try {
        // Handle file uploads
        let avatarFileName = null;
        let bannerFileName = null;  // Add banner variable
        let licenseFrontFileName = null;
        let licenseBackFileName = null;
  
        if (files.avatar?.[0]) {
          const fileName = `${Date.now()}-${files.avatar[0].originalname}`;
          await SojebStorage.put(
            `avatars/${fileName}`,
            files.avatar[0].buffer
          );
          avatarFileName = fileName;
        }
  
        if (files.banner?.[0]) {
          const fileName = `${Date.now()}-${files.banner[0].originalname}`;
          await SojebStorage.put(
            `banners/${fileName}`,
            files.banner[0].buffer
          );
          bannerFileName = fileName;
        }
  
        if (files.license_front?.[0]) {
          const fileName = `${Date.now()}-${files.license_front[0].originalname}`;
          await SojebStorage.put(
            `licenses/${fileName}`,
            files.license_front[0].buffer
          );
          licenseFrontFileName = fileName;
        }
  
        if (files.license_back?.[0]) {
          const fileName = `${Date.now()}-${files.license_back[0].originalname}`;
          await SojebStorage.put(
            `licenses/${fileName}`,
            files.license_back[0].buffer
          );
          licenseBackFileName = fileName;
        }
  
        // Update user profile
        const updatedUser = await this.prisma.user.update({
          where: { id: userId },
          data: {
            name: updateData.name,
            email: updateData.email,
            phone_number: updateData.phone,
            address: updateData.address,
            date_of_birth: new Date(updateData.date_of_birth),
            ...(avatarFileName && { avatar: avatarFileName }),
            ...(bannerFileName && { banner: bannerFileName }),  // Add banner update
            service_provider: {
              update: {
                business_location: updateData.business_location,
                ...(licenseFrontFileName && { license_front: licenseFrontFileName }),
                ...(licenseBackFileName && { license_back: licenseBackFileName }),
                aboutus: updateData.about
              }
            }
          },
          include: {
            service_provider: true
          }
        });
  
        // Add banner URL to response
         if (updatedUser.banner) {
          updatedUser['banner_url'] = SojebStorage.url(
            appConfig().storageUrl.banner + updatedUser.banner // Use avatar path for now
          );
        }

        return {
          success: true,
          message: 'Profile updated successfully',
          data: updatedUser
        };
      } catch (error) {
        return {
          success: false,
          message: error.message
        };
      }
    }
}
