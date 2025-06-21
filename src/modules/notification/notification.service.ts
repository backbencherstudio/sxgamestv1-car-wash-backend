import { Injectable } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationService {
  private firebaseApp: admin.app.App;

  constructor(private prisma: PrismaService) {
    //  // Initialize Firebase Admin
    //  if (!admin.apps.length) {
    //   admin.initializeApp({
    //     credential: admin.credential.cert({
    //       projectId: process.env.FIREBASE_PROJECT_ID,
    //       clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    //       privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    //     }),
    //   });
    
    // Initialize Firebase Admin only if credentials are available
    if (process.env.FIREBASE_PROJECT_ID && 
        process.env.FIREBASE_CLIENT_EMAIL && 
        process.env.FIREBASE_PRIVATE_KEY) {
      try {
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          }),
        });
      } catch (error) {
        console.error('Failed to initialize Firebase Admin:', error);
      }
    } else {
      console.warn('Firebase credentials not found. Push notifications will be disabled.');
    }
  }

  // Get notifications for a specific user
  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 10,
    readStatus?: 'all' | 'read' | 'unread'
  ) {
    try {
      const skip = (page - 1) * limit;
      
      // Build where condition
      const where: any = {
        receiver_id: userId,
        deleted_at: null,
      };

      // Add read status filter
      if (readStatus === 'read') {
        where.read_at = { not: null };
      } else if (readStatus === 'unread') {
        where.read_at = null;
      }

      const [notifications, total] = await Promise.all([
        this.prisma.notification.findMany({
          where,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
            notification_event: {
              select: {
                id: true,
                type: true,
                text: true,
              },
            },
          },
          orderBy: {
            created_at: 'desc',
          },
          skip,
          take: limit,
        }),
        this.prisma.notification.count({
          where,
        }),
      ]);

      return {
        success: true,
        data: {
          notifications,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // Get unread notification count for a user
  async getUnreadCount(userId: string) {
    try {
      const count = await this.prisma.notification.count({
        where: {
          receiver_id: userId,
          read_at: null,
          deleted_at: null,
        },
      });

      return {
        success: true,
        data: { unreadCount: count },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string) {
    try {
      const notification = await this.prisma.notification.findFirst({
        where: {
          id: notificationId,
          receiver_id: userId,
          deleted_at: null,
        },
      });

      if (!notification) {
        return {
          success: false,
          message: 'Notification not found',
        };
      }

      const updatedNotification = await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          read_at: new Date(),
          updated_at: new Date(),
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          notification_event: {
            select: {
              id: true,
              type: true,
              text: true,
            },
          },
        },
      });

      return {
        success: true,
        message: 'Notification marked as read',
        data: updatedNotification,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string) {
    try {
      const result = await this.prisma.notification.updateMany({
        where: {
          receiver_id: userId,
          read_at: null,
          deleted_at: null,
        },
        data: {
          read_at: new Date(),
          updated_at: new Date(),
        },
      });

      return {
        success: true,
        message: 'All notifications marked as read',
        data: { updatedCount: result.count },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // Delete a notification for a user
  async deleteNotification(notificationId: string, userId: string) {
    try {
      const notification = await this.prisma.notification.findFirst({
        where: {
          id: notificationId,
          receiver_id: userId,
          deleted_at: null,
        },
      });

      if (!notification) {
        return {
          success: false,
          message: 'Notification not found',
        };
      }

      await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          deleted_at: new Date(),
        },
      });

      return {
        success: true,
        message: 'Notification deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
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
      if (!this.firebaseApp) {
        return {
          success: false,
          message: 'Firebase not initialized. Push notifications are disabled.',
        };
      }

      // const token = "eTkeuo2TSumJQkTrSpbqC0:APA91bF81pYhOnzqd7R15KluklrX3RJOAYkA0GK-fwy1cKxXzaiz3kUl-hax5Xil6ppusOZ-1jWKwhHr__chcJZMbbsYaJoXAt53OmhBHg47Y95JCPEb0-E"
      
      // const message = {
      //   notification: {
      //     title,
      //     body,
      //   },
      //   data: data || {},
      //   token,
      // };
      
      // const response = await this.firebaseApp.messaging().send(message);
      
      // return {
      //   success: true,
      //   message: 'Notification sent successfully',
      //   response,
      // };
      
      // Get all FCM tokens
      const tokens = await this.prisma.fCMToken.findMany({
        select: {
          token: true,
        },
      });
      // console.log(tokens)

      if (tokens.length === 0) {
        return {
          success: false,
          message: 'No FCM tokens found',
        };
      }

      // // Send to each token
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
            return await this.firebaseApp.messaging().send(message);
          } catch (error) {
            console.error(`Failed to send notification to token: ${error.message}`);
            return null;
          }
        })
      );
      // console.log(results)
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
