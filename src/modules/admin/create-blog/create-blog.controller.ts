import { Controller, Post, Body, UseGuards, Req, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { CreateBlogService } from './create-blog.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { Role } from 'src/common/guard/role/role.enum';
import { Roles } from 'src/common/guard/role/roles.decorator';

@Controller('admin/blog')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class CreateBlogController {
  constructor(private readonly createBlogService: CreateBlogService) {}

  @Post()
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'thumbnail', maxCount: 1 }
  ]))
  async create(
    @Req() req,
    @Body() createBlogDto: {
      title: string;
      content: string;
      category: string;
      is_featured: string;
    },
    @UploadedFiles() files: {
      thumbnail?: Express.Multer.File[];
    }
  ) {
    try {
      const userId = req.user.userId;
      return await this.createBlogService.create(userId, createBlogDto, files);
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}
