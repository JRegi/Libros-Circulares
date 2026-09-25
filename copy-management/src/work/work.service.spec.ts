import { Test, TestingModule } from '@nestjs/testing';
import { WorkService } from './work.service';
import { AuthorService } from '../author/author.service';

describe('WorkService', () => {
  let service: WorkService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkService, AuthorService],
    }).compile();

    service = module.get<WorkService>(WorkService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
