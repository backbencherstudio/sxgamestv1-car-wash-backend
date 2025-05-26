import { PartialType } from '@nestjs/swagger';
import { CreateCreateBlogDto } from './create-create-blog.dto';

export class UpdateCreateBlogDto extends PartialType(CreateCreateBlogDto) {}
