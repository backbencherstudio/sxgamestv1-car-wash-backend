import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { BlogService } from './blog.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('blog')
@UseGuards(JwtAuthGuard)
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
