import { Controller, Post, Body, UseGuards, Req, UploadedFiles, UseInterceptors, Param, Delete, Get, Query, Patch } from '@nestjs/common';
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

  @Patch(':id')
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
  async update(
    @Req() req,
    @Param('id') id: string,
    @Body() updateBlogDto: {
      title?: string;
      sub_title?: string;
      content?: string;
      category?: string;
      is_featured?: string;
    },
    @UploadedFiles() files: {
      thumbnail?: Express.Multer.File[];
    }
  ) {
    try {
      const userId = req.user.userId;
      return await this.createBlogService.update(
        id,
        userId,
        updateBlogDto,
        { thumbnail: files.thumbnail?.[0]?.filename }
      );
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  @Delete(':id')
  async delete(
    @Req() req,
    @Param('id') id: string
  ) {
    try {
      const userId = req.user.userId;
      return await this.createBlogService.delete(id, userId);
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('is_featured') is_featured?: string
  ) {
    try {
      return await this.createBlogService.findAll(
        page ? parseInt(page) : 1,
        limit ? parseInt(limit) : 10,
        search,
        category,
        is_featured ? is_featured === 'true' : undefined
      );
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.createBlogService.findOne(id);
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}
