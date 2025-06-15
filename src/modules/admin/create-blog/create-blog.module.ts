import { Module } from '@nestjs/common';
import { CreateBlogController } from './create-blog.controller';
import { CreateBlogService } from './create-blog.service';
import { NotificationModule } from '../../../modules/notification/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [CreateBlogController],
  providers: [CreateBlogService],
  exports: [CreateBlogService]
})
export class CreateBlogModule {}
