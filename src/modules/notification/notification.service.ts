import { Injectable } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {
    // Initialize Firebase Admin
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    }
  }

  async saveFCMToken(userId: string, token: string) {
    try {
      // Check if token already exists
      const existingToken = await this.prisma.fCMToken.findFirst({
        where: {
          user_id: userId,
          token: token,
        },
      });

      if (existingToken) {
        return {
          success: true,
          message: 'FCM token already exists',
        };
      }

      // Save new token
      await this.prisma.fCMToken.create({
        data: {
          user_id: userId,
          token: token,
        },
      });

      return {
        success: true,
        message: 'FCM token saved successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async removeFCMToken(userId: string, token: string) {
    try {
      await this.prisma.fCMToken.deleteMany({
        where: {
          user_id: userId,
          token: token,
        },
      });

      return {
        success: true,
        message: 'FCM token removed successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async sendNotification(title: string, body: string, data?: any) {
    try {
      // Get all FCM tokens
      const tokens = await this.prisma.fCMToken.findMany({
        select: {
          token: true,
        },
      });

      if (tokens.length === 0) {
        return {
          success: false,
          message: 'No FCM tokens found',
        };
      }

      // Send to each token
      const results = await Promise.all(
        tokens.map(async (token) => {
          try {
            const message = {
              notification: {
                title,
                body,
              },
              data: data || {},
              token: token.token,
            };
            return await admin.messaging().send(message);
          } catch (error) {
            console.error(`Failed to send notification to token: ${error.message}`);
            return null;
          }
        })
      );

      const successCount = results.filter(r => r !== null).length;
      const failureCount = tokens.length - successCount;

      return {
        success: true,
        message: 'Notifications sent successfully',
        data: {
          successCount,
          failureCount,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
