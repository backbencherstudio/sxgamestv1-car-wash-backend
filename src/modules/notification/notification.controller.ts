import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('notification')
@ApiBearerAuth()
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('fcm-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Save FCM token for push notifications' })
  async saveFCMToken(
    @Req() req,
    @Body() body: { token: string }
  ) {
    return await this.notificationService.saveFCMToken(req.user.userId, body.token);
  }

  @Delete('fcm-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Remove FCM token' })
  async removeFCMToken(
    @Req() req,
    @Body() body: { token: string }
  ) {
    return await this.notificationService.removeFCMToken(req.user.userId, body.token);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get notifications for the logged-in user' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 10)' })
  @ApiQuery({ 
    name: 'readStatus', 
    required: false, 
    description: 'Filter by read status: all, read, unread (default: all)',
    enum: ['all', 'read', 'unread']
  })
  async getUserNotifications(
    @Req() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('readStatus') readStatus: 'all' | 'read' | 'unread' = 'all'
  ) {
    return await this.notificationService.getUserNotifications(
      req.user.userId,
      parseInt(page),
      parseInt(limit),
      readStatus
    );
  }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get unread notification count for the logged-in user' })
  async getUnreadCount(@Req() req) {
    return await this.notificationService.getUnreadCount(req.user.userId);
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mark a specific notification as read' })
  async markAsRead(@Req() req, @Param('id') id: string) {
    return await this.notificationService.markAsRead(id, req.user.userId);
  }

  @Patch('mark-all-read')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mark all notifications as read for the logged-in user' })
  async markAllAsRead(@Req() req) {
    return await this.notificationService.markAllAsRead(req.user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a specific notification for the logged-in user' })
  async deleteNotification(@Req() req, @Param('id') id: string) {
    return await this.notificationService.deleteNotification(id, req.user.userId);
  }
}
