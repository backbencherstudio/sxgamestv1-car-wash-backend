import { Controller, Post, Body, UseGuards, Req, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { CreateBlogService } from './create-blog.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { Role } from 'src/common/guard/role/role.enum';
import { Roles } from 'src/common/guard/role/roles.decorator';
import { diskStorage } from 'multer';
import appConfig from 'src/config/app.config';

@Controller('admin/blog')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class CreateBlogController {
  constructor(private readonly createBlogService: CreateBlogService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'thumbnail', maxCount: 1 }
    ], {
      storage: diskStorage({
        destination: appConfig().storageUrl.rootUrl + appConfig().storageUrl.blog,
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${file.originalname}`);
        },
      }),
    })
  )
  async create(
    @Req() req,
    @Body() createBlogDto: {
      title: string;
      sub_title: string;
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
      return await this.createBlogService.create(
        userId, 
        createBlogDto, 
        { thumbnail: files.thumbnail?.[0]?.filename }
      );
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}
