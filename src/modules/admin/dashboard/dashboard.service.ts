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
    const subscriberStats = await this.prisma.subscription.groupBy({
      by: ['created_at'],
      where: {
        deleted_at: null,
        created_at: {
          gte: startDate
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        created_at: 'asc'
      }
    });

    const formattedSubscriberStats = subscriberStats.map(stat => ({
      year: stat.created_at.getFullYear(),
      month: stat.created_at.toLocaleString('default', { month: 'short' }),
      subscription: stat._count.id
    }));

    // Get unique years from subscriber stats
    const subscriberYears = [...new Set(formattedSubscriberStats.map(stat => stat.year))].sort();

    // Create a complete dataset with all months for each year for subscribers
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const completeSubscriberStats = subscriberYears.flatMap(year => 
      months.map(month => {
        const existingStat = formattedSubscriberStats.find(stat => 
          stat.year === year && stat.month === month
        );
        return {
          year,
          month,
          subscription: existingStat ? existingStat.subscription : 0
        };
      })
    );

    // Get revenue statistics
    const revenueStats = await this.prisma.paymentTransaction.groupBy({
      by: ['created_at'],
      where: {
        status: 'completed',
        deleted_at: null,
        created_at: {
          gte: startDate
        }
      },
      _sum: {
        paid_amount: true,
        amount: true
      },
      orderBy: {
        created_at: 'asc'
      }
    });

    const formattedStats = revenueStats.map(stat => ({
      year: stat.created_at.getFullYear(),
      month: stat.created_at.toLocaleString('default', { month: 'short' }),
      revenue: Number(stat._sum.paid_amount || stat._sum.amount || 0)
    }));

    // Get unique years from revenue stats
    const revenueYears = [...new Set(formattedStats.map(stat => stat.year))].sort();

    // Create a complete dataset with all months for each year for revenue
    const completeRevenueStats = revenueYears.flatMap(year => 
      months.map(month => {
        const existingStat = formattedStats.find(stat => 
          stat.year === year && stat.month === month
        );
        return {
          year,
          month,
          revenue: existingStat ? existingStat.revenue : 0
        };
      })
    );

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
        years: revenueYears,
        data: completeRevenueStats
      },
      subscriberStatistics: {
        period,
        years: subscriberYears,
        data: completeSubscriberStats
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
