import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;

    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const subscription = await this.prisma.subscription.findFirst({
      where: {
        user_id: userId,
        is_active: true,
        deleted_at: null,
        status: 'active',
        cancel_at_period_end: false
      }
    });

    if (!subscription) {
      throw new UnauthorizedException('No active subscription found. Please subscribe to continue.');
    }

    return true;
  }
} 