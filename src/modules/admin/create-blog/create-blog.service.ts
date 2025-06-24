import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';
import appConfig from 'src/config/app.config';
import { NotificationService } from 'src/modules/notification/notification.service';
import { NotificationRepository } from 'src/common/repository/notification/notification.repository';

@Injectable()
export class CreateBlogService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService
  ) {}

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
          user: {
            connect: {
              id: userId
            }
          }
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
        blog['thumbnail_url'] = 'storage' + appConfig().storageUrl.blog + blog.thumbnail;
      }

      // Send notification for new blog
      const notificationResult = await this.notificationService.sendNotification(
        'New Blog Post',
        `${blog.title} - ${blog.sub_title}`,
        {
          type: 'new_blog',
          blogId: blog.id,
          slug: blog.slug
        }
      );

      // If push notification was sent successfully, store in database
      if (notificationResult.success) {
        try {
          // Get all users to send notification to (or specific users based on your logic)
          const users = await this.prisma.user.findMany({
            where: {
              deleted_at: null,
              status: 1,
            },
            select: {
              id: true,
            },
          });

          // Create notification in database for each user
          for (const user of users) {
            await NotificationRepository.createNotification({
              sender_id: userId, // Blog creator
              receiver_id: user.id, // Each user
              text: `New blog post: ${blog.title} - ${blog.sub_title}`,
              type: 'blog',
              entity_id: blog.id,
            });
          }

        } catch (dbError) {
          console.error('Failed to store notification in database:', dbError);
          // Don't fail the blog creation if database storage fails
        }
      }

      return {
        success: true,
        message: 'Blog created successfully',
        data: blog,
        notification: notificationResult,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async update(
    id: string,
    userId: string,
    updateBlogDto: {
      title?: string;
      sub_title?: string;
      content?: string;
      category?: string;
      is_featured?: string;
    },
    files: {
      thumbnail?: string;
    }
  ) {
    try {
      const blog = await this.prisma.blog.update({
        where: {
          id: id,
          user_id: userId
        },
        data: {
          title: updateBlogDto.title,
          sub_title: updateBlogDto.sub_title,
          content: updateBlogDto.content,
          category: updateBlogDto.category,
          is_featured: updateBlogDto.is_featured === 'true',
          thumbnail: files.thumbnail || undefined,
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
        blog['thumbnail_url'] = 'storage' + appConfig().storageUrl.blog + blog.thumbnail;
      }

      return {
        success: true,
        message: 'Blog updated successfully',
        data: blog,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async delete(id: string, userId: string) {
    try {
      // First check if the blog exists and belongs to the user
      const blog = await this.prisma.blog.findFirst({
        where: {
          id: id,
          user_id: userId
        }
      });

      if (!blog) {
        return {
          success: false,
          message: 'Blog not found or you do not have permission to delete it'
        };
      }

      // Delete the blog
      await this.prisma.blog.delete({
        where: {
          id: id
        }
      });

      return {
        success: true,
        message: 'Blog deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
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

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    category?: string,
    is_featured?: boolean
  ) {
    try {
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
          { sub_title: { contains: search, mode: 'insensitive' } }
        ];
      }
      if (category) {
        where.category = category;
      }
      if (is_featured !== undefined) {
        where.is_featured = is_featured;
      }

      // Get total count
      const total = await this.prisma.blog.count({ where });

      // Get blogs
      const blogs = await this.prisma.blog.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          created_at: 'desc'
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

      // Add thumbnail URLs
      const blogsWithUrls = blogs.map(blog => {
        if (blog.thumbnail) {
          blog['thumbnail_url'] = 'storage' + appConfig().storageUrl.blog + blog.thumbnail;
        }
        return blog;
      });

      return {
        success: true,
        data: {
          blogs: blogsWithUrls,
          pagination: {
            total,
            page,
            limit,
            total_pages: Math.ceil(total / limit)
          }
        }
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
          id: id
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

      if (!blog) {
        return {
          success: false,
          message: 'Blog not found'
        };
      }

      // Add thumbnail URL
      if (blog.thumbnail) {
        blog['thumbnail_url'] = 'storage' + appConfig().storageUrl.blog + blog.thumbnail;
      }

      // Increment view count
      await this.prisma.blog.update({
        where: { id: id },
        data: { views: { increment: 1 } }
      });

      return {
        success: true,
        data: blog
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}
