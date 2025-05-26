import { Controller, Get, Param } from '@nestjs/common';
import { BlogService } from './blog.service';

@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  async findAll() {
    try {
      return await this.blogService.findAll();
    } catch (error) {
      return {
        status: false,
        message: error.message,
      }
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.blogService.findOne(id);
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
