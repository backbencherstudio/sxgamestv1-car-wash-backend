import { Test, TestingModule } from '@nestjs/testing';
import { CreateBlogService } from './create-blog.service';

describe('CreateBlogService', () => {
  let service: CreateBlogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CreateBlogService],
    }).compile();

    service = module.get<CreateBlogService>(CreateBlogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
