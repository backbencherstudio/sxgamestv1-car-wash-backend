import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';
import appConfig from 'src/config/app.config';

@Injectable()
export class CreateBlogService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    createBlogDto: {
      title: string;
      sub_title: string;
      content: string;
      category: string;
      is_featured: string;
    },
    files: {
      thumbnail?: string;
    }
  ) {
    try {
      const slug = this.createSlug(createBlogDto.title);

      const blog = await this.prisma.blog.create({
        data: {
          title: createBlogDto.title,
          sub_title: createBlogDto.sub_title,
          slug: slug,
          content: createBlogDto.content,
          category: createBlogDto.category,
          is_featured: createBlogDto.is_featured === 'true',
          thumbnail: files.thumbnail || null,
          user_id: userId,
        },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });

      if (blog.thumbnail) {
        blog['thumbnail_url'] = 'public/storage' + appConfig().storageUrl.blog + blog.thumbnail;
      }

      return {
        success: true,
        message: 'Blog created successfully',
        data: blog,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  private createSlug(title: string): string {
    const timestamp = Date.now();
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + timestamp;
  }
}
