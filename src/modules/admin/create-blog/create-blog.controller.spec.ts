import { Test, TestingModule } from '@nestjs/testing';
import { CreateBlogController } from './create-blog.controller';
import { CreateBlogService } from './create-blog.service';

describe('CreateBlogController', () => {
  let controller: CreateBlogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreateBlogController],
      providers: [CreateBlogService],
    }).compile();

    controller = module.get<CreateBlogController>(CreateBlogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
