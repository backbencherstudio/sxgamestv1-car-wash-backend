import { Module } from '@nestjs/common';
import { FaqModule } from './faq/faq.module';
import { ContactModule } from './contact/contact.module';
import { WebsiteInfoModule } from './website-info/website-info.module';
import { PaymentTransactionModule } from './payment-transaction/payment-transaction.module';
import { UserModule } from './user/user.module';
import { NotificationModule } from './notification/notification.module';
import { ServicesModule } from './services/services.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ManageBookingsModule } from './manage-bookings/manage-bookings.module';
import { ScheduleCalenderModule } from './schedule-calender/schedule-calender.module';
import { ProfileModule } from './profile/profile.module';
import { CreateBlogModule } from './create-blog/create-blog.module';

@Module({
  imports: [
    FaqModule,
    ContactModule,
    WebsiteInfoModule,
    PaymentTransactionModule,
    UserModule,
    NotificationModule,
    ServicesModule,
    DashboardModule,
    ManageBookingsModule,
    ScheduleCalenderModule,
    ProfileModule,
    CreateBlogModule,
  ],
})
export class AdminModule {}
