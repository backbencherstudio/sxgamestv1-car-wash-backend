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
        select: {
          id: true,
          title: true,
          sub_title: true,
          slug: true,
          content: true,
          thumbnail: true,
          category: true,
          views: true,
          is_featured: true,
          created_at: true,
          updated_at: true,
          user: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      });

      // Add thumbnail URLs and format the response
      const blogsWithUrls = blogs.map(blog => ({
        ...blog,
        thumbnail_url: blog.thumbnail ? 
          'public/storage' + appConfig().storageUrl.blog + blog.thumbnail : null,
        total_views: blog.views || 0, // Explicitly include view count
        user: {
          ...blog.user,
          avatar_url: blog.user.avatar ? 
            SojebStorage.url(appConfig().storageUrl.avatar + blog.user.avatar) : null
        }
      }));

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

  async findOne(id: string, userId: string) {
    try {
      // First check if the user has already viewed this blog
      const existingView = await this.prisma.blogView.findUnique({
        where: {
          blog_id_user_id: {
            blog_id: id,
            user_id: userId
          }
        }
      });

      // If this is the first time viewing, create a view record and increment the view count
      if (!existingView) {
        await this.prisma.$transaction([
          this.prisma.blogView.create({
            data: {
              blog_id: id,
              user_id: userId
            }
          }),
          this.prisma.blog.update({
            where: { id },
            data: {
              views: {
                increment: 1
              }
            }
          })
        ]);
      }

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
        total_views: blog.views || 0, // Explicitly include view count
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
