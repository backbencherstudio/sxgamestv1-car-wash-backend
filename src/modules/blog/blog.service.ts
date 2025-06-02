import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';
import appConfig from 'src/config/app.config';

@Injectable()
export class BlogService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    try {
      const blogs = await this.prisma.blog.findMany({
        where: {
          deleted_at: null,
        },
        orderBy: {
          created_at: 'desc'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      });

      // Add thumbnail URLs
      const blogsWithUrls = blogs.map(blog => {
        if (blog.thumbnail) {
          blog['thumbnail_url'] = 'public/storage' + appConfig().storageUrl.blog + blog.thumbnail;
        }
        return blog;
      });

      return {
        success: true,
        data: blogsWithUrls
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  async findOne(id: string) {
    try {
      const blog = await this.prisma.blog.findUnique({
        where: {
          id: id,
          deleted_at: null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      });

      if (!blog) {
        return {
          success: false,
          message: 'Blog not found'
        };
      }

      // Add URLs
      const blogWithUrls = {
        ...blog,
        thumbnail_url: blog.thumbnail ? 
          'public/storage' + appConfig().storageUrl.blog + blog.thumbnail : null,
        user: {
          ...blog.user,
          avatar_url: blog.user.avatar ? 
            SojebStorage.url(appConfig().storageUrl.avatar + blog.user.avatar) : null
        }
      };

      return {
        success: true,
        data: blogWithUrls
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}
