import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('fcm-token')
  @UseGuards(JwtAuthGuard)
  async saveFCMToken(
    @Req() req,
    @Body() body: { token: string }
  ) {
    return await this.notificationService.saveFCMToken(req.user.userId, body.token);
  }

  @Delete('fcm-token')
  @UseGuards(JwtAuthGuard)
  async removeFCMToken(
    @Req() req,
    @Body() body: { token: string }
  ) {
    return await this.notificationService.removeFCMToken(req.user.userId, body.token);
  }
}
