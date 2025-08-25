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
          aboutus: true,
          availability: true,
          banner:true,
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

      // Add avatar URL
      if (user.avatar) {
        user['avatar_url'] = appConfig().storageUrl.rootUrlPublic + appConfig().storageUrl.avatar + user.avatar;
      }

      // Add license URLs if they exist in service_provider
      if (user.service_provider) {
        if (user.service_provider.license_front) {
          user.service_provider['license_front_url'] = appConfig().storageUrl.rootUrlPublic + appConfig().storageUrl.license + user.service_provider.license_front;
        }
        if (user.service_provider.license_back) {
          user.service_provider['license_back_url'] = appConfig().storageUrl.rootUrlPublic + appConfig().storageUrl.license + user.service_provider.license_back;
        }
      }
      if (user.banner) {
          user['banner_url'] = appConfig().storageUrl.rootUrlPublic + appConfig().storageUrl.banner + user.banner;
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
        banner?: Express.Multer.File[];
      }
    ) {
      try {
        // Get current user data to delete old files
        const currentUser = await this.prisma.user.findUnique({
          where: { id: userId },
          include: { service_provider: true }
        });

        // Handle file uploads
        let avatarFileName = null;
        let bannerFileName = null;
        let licenseFrontFileName = null;
        let licenseBackFileName = null;
  
        if (files.avatar?.[0]) {
          // Delete old avatar if exists
          if (currentUser.avatar) {
            await SojebStorage.delete(`avatar/${currentUser.avatar}`);
          }
          const fileName = `${Date.now()}-${files.avatar[0].originalname}`;
          await SojebStorage.put(
            `avatar/${fileName}`,
            files.avatar[0].buffer
          );
          avatarFileName = fileName;
        }
  
        if (files.banner?.[0]) {
          // Delete old banner if exists
          if (currentUser.banner) {
            await SojebStorage.delete(`banner/${currentUser.banner}`);
          }
          const fileName = `${Date.now()}-${files.banner[0].originalname}`;
          await SojebStorage.put(
            `banner/${fileName}`,
            files.banner[0].buffer
          );
          bannerFileName = fileName;
        }
  
        if (files.license_front?.[0]) {
          // Delete old license front if exists
          if (currentUser.service_provider?.license_front) {
            await SojebStorage.delete(`license/${currentUser.service_provider.license_front}`);
          }
          const fileName = `${Date.now()}-${files.license_front[0].originalname}`;
          await SojebStorage.put(
            `license/${fileName}`,
            files.license_front[0].buffer
          );
          licenseFrontFileName = fileName;
        }
  
        if (files.license_back?.[0]) {
          // Delete old license back if exists
          if (currentUser.service_provider?.license_back) {
            await SojebStorage.delete(`license/${currentUser.service_provider.license_back}`);
          }
          const fileName = `${Date.now()}-${files.license_back[0].originalname}`;
          await SojebStorage.put(
            `license/${fileName}`,
            files.license_back[0].buffer
          );
          licenseBackFileName = fileName;
        }

        // Ensure date_of_birth is properly validated
        let dateOfBirth = null; // Default to null

        if (updateData.date_of_birth) {
          dateOfBirth = new Date(updateData.date_of_birth);
          if (isNaN(dateOfBirth.getTime())) {
            dateOfBirth = null; // If the date is invalid, set it to null
          }
        }

        // Update user profile
        const updatedUser = await this.prisma.user.update({
          where: { id: userId },
          data: {
            // only include top-level fields if provided (avoid sending undefined)
            ...(updateData.name !== undefined ? { name: updateData.name } : {}),
            ...(updateData.email !== undefined ? { email: updateData.email } : {}),
            ...(updateData.phone !== undefined ? { phone_number: updateData.phone } : {}),
            ...(updateData.address !== undefined ? { address: updateData.address } : {}),
            // user.date_of_birth is nullable in schema, so include only when valid
            ...(dateOfBirth !== null ? { date_of_birth: dateOfBirth } : {}),
            ...(updateData.about !== undefined ? { aboutus: updateData.about } : {}),
            ...(avatarFileName ? { avatar: avatarFileName } : {}),
            ...(bannerFileName ? { banner: bannerFileName } : {}),

            // ServiceProvider nested upsert: schema requires several non-null strings and date
            service_provider: {
              upsert: {
                create: {
                  // Provide all non-nullable fields. Use provided values when valid, otherwise safe defaults.
                  business_name: updateData.name || '',
                  business_number: '',
                  nid_number: '',
                  license_number: '',
                  // business_location is required in schema — ensure a string is always provided
                  business_location: updateData.business_location || '',
                  permanent_address: updateData.address || '',
                  license_front: licenseFrontFileName || '',
                  license_back: licenseBackFileName || '',
                  aboutus: updateData.about || '',
                  // ServiceProvider.date_of_birth is non-nullable: use parsed date when valid, else fallback to now
                  date_of_birth: dateOfBirth !== null ? dateOfBirth : new Date()
                },
                update: {
                  // For updates, only change fields when the caller supplied them (avoid writing undefined)
                  ...(updateData.name !== undefined ? { business_name: updateData.name } : {}),
                  ...(updateData.business_location !== undefined ? { business_location: updateData.business_location } : {}),
                  ...(updateData.address !== undefined ? { permanent_address: updateData.address } : {}),
                  ...(dateOfBirth !== null ? { date_of_birth: dateOfBirth } : {}),
                  ...(licenseFrontFileName ? { license_front: licenseFrontFileName } : {}),
                  ...(licenseBackFileName ? { license_back: licenseBackFileName } : {}),
                  ...(updateData.about !== undefined ? { aboutus: updateData.about } : {})
                }
              }
            }
          },
          include: { service_provider: true }
        });

  
        // Add banner URL to response
         if (updatedUser.banner) {
          updatedUser['banner_url'] = appConfig().storageUrl.rootUrlPublic + appConfig().storageUrl.banner + updatedUser.banner;
        }

        // Add avatar URL
        if (updatedUser.avatar) {
          updatedUser['avatar_url'] = appConfig().storageUrl.rootUrlPublic + appConfig().storageUrl.avatar + updatedUser.avatar;
        }

        // Add license URLs if they exist in service_provider
        if (updatedUser.service_provider) {
          if (updatedUser.service_provider.license_front) {
            updatedUser.service_provider['license_front_url'] = appConfig().storageUrl.rootUrlPublic + appConfig().storageUrl.license + updatedUser.service_provider.license_front;
          }
          if (updatedUser.service_provider.license_back) {
            updatedUser.service_provider['license_back_url'] = appConfig().storageUrl.rootUrlPublic + appConfig().storageUrl.license + updatedUser.service_provider.license_back;
          }
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
