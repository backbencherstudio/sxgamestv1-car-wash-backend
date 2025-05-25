import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const totalSubscription = await this.prisma.subscription.count({
      where: {
        is_active: true,
        deleted_at: null
      }
    });

    const revenue = await this.prisma.paymentTransaction.aggregate({
      where: {
        status: 'completed',
        deleted_at: null,
        type: 'subscription'
      },
      _sum: {
        amount: true
      }
    });

    const totalServiceRequests = await this.prisma.serviceBooking.count({
      where: {
        deleted_at: null
      }
    });

    const ongoingWorkCount = await this.prisma.serviceBooking.count({
      where: {
        status: 'ongoing',
        deleted_at: null
      }
    });

    return {
      totalSubscription,
      revenue: revenue._sum.amount || 0,
      totalServiceRequests,
      ongoingWorkCount
    };
  }
}
