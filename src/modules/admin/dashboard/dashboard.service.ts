import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async findAll(period: 'yearly' | 'monthly' = 'monthly') {
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
        status: 'pending',
        deleted_at: null
      }
    });

    const ongoingWorkCount = await this.prisma.serviceBooking.count({
      where: {
        status: 'ongoing',
        deleted_at: null
      }
    });

    // Get revenue statistics
    const startDate = new Date();
    if (period === 'yearly') {
      // For monthly period, get data for current month and previous 11 months
      startDate.setMonth(startDate.getMonth() - 11);
    } else {
      // For yearly period, get data for last two years
      startDate.setFullYear(startDate.getFullYear() - 1);
    }
    startDate.setDate(1);
    startDate.setMonth(0); // Start from January of that year

    // Get subscriber statistics
    const subscriberStats = await this.prisma.$queryRaw`
      WITH months AS (
        SELECT generate_series(
          DATE_TRUNC('month', ${startDate}::timestamp),
          DATE_TRUNC('month', CURRENT_DATE),
          '1 month'::interval
        ) AS date
      )
      SELECT 
        EXTRACT(YEAR FROM months.date) as year,
        EXTRACT(MONTH FROM months.date) as month_num,
        COUNT(s.id) as count
      FROM months
      LEFT JOIN "subscriptions" s ON 
        DATE_TRUNC('month', s.created_at) = months.date
        AND s.deleted_at IS NULL
      GROUP BY year, month_num
      ORDER BY year ASC, month_num ASC
    `;

    const formattedSubscriberStats = (subscriberStats as any[]).map(stat => ({
      year: Number(stat.year),
      month: new Date(stat.year, stat.month_num - 1, 1).toLocaleString('default', { month: 'short' }),
      subscription: Number(stat.count)
    }));

    // Get revenue statistics
    const revenueStats = await this.prisma.$queryRaw`
      WITH months AS (
        SELECT generate_series(
          DATE_TRUNC('month', ${startDate}::timestamp),
          DATE_TRUNC('month', CURRENT_DATE),
          '1 month'::interval
        ) AS date
      )
      SELECT
        EXTRACT(YEAR FROM months.date) as year,
        EXTRACT(MONTH FROM months.date) as month_num,
        COALESCE(SUM(pt.amount), 0) as total_amount
      FROM months
      LEFT JOIN "payment_transactions" pt ON
        DATE_TRUNC('month', pt.created_at) = months.date
        AND pt.status = 'completed'
        AND pt.deleted_at IS NULL
      GROUP BY year, month_num
      ORDER BY year ASC, month_num ASC
    `;

    const formattedStats = (revenueStats as any[]).map(stat => ({
      year: Number(stat.year),
      // Map month number to month name (basic example, could use a library or map)
      month: new Date(stat.year, stat.month_num - 1, 1).toLocaleString('default', { month: 'short' }),
      revenue: Number(stat.total_amount) || 0
    }));

    // Get recent pending orders
    const recentOrders = await this.prisma.serviceBooking.findMany({
      where: {
        status: 'pending',
        deleted_at: null
      },
      select: {
        id: true,
        service_type: true,
        location: true,
        schedule_datetime: true,
        user: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 10 // Limit to 10 recent orders
    });

    const formattedRecentOrders = recentOrders.map(order => ({
      orderId: order.id,
      userName: order.user.name,
      serviceName: order.service_type,
      serviceType: order.service_type,
      location: order.location,
      serviceDate: order.schedule_datetime
    }));

    return {
      totalSubscription,
      revenue: revenue._sum.amount || 0,
      totalServiceRequests,
      ongoingWorkCount,
      revenueStatistics: {
        period,
        data: formattedStats
      },
      subscriberStatistics: {
        period,
        data: formattedSubscriberStats
      },
      recentOrders: formattedRecentOrders
    };
  }

  async updateServiceStatus(id: string, action: 'accept' | 'reject') {
      const status = action === 'accept' ? 'ongoing' : 'cancelled';
  
      const updatedBooking = await this.prisma.serviceBooking.update({
        where: { id },
        data: { status },
        select: {
          id: true,
          status: true,
          service_type: true,
          location: true,
          schedule_datetime: true,
          user: {
            select: {
              name: true
            }
          }
        }
      });
  
      return {
        status: true,
        message: `Service booking ${action}ed successfully`,
        data: {
          orderId: updatedBooking.id,
          userName: updatedBooking.user.name,
          serviceName: updatedBooking.service_type,
          serviceType: updatedBooking.service_type,
          location: updatedBooking.location,
          serviceDate: updatedBooking.schedule_datetime,
          status: updatedBooking.status
        }
      };
    }

 
}
