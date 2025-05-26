import { Module } from '@nestjs/common';
import { CreateBlogService } from './create-blog.service';
import { CreateBlogController } from './create-blog.controller';

@Module({
  controllers: [CreateBlogController],
  providers: [CreateBlogService],
})
export class CreateBlogModule {}
