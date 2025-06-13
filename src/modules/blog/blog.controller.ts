import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { BlogService } from './blog.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

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
  async findOne(@Param('id') id: string, @Req() req: Request) {
    try {
      return await this.blogService.findOne(id, req.user.userId);
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
