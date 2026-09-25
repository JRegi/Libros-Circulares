import { Test, TestingModule } from '@nestjs/testing';
import { CopyService } from './copy.service';
import { UserClient } from './clients/user.client';
import { EditionService } from '../edition/edition.service';
import { WorkService } from '../work/work.service';
import { AuthorService } from '../author/author.service';

describe('CopyService', () => {
  let service: CopyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CopyService, UserClient, EditionService, WorkService, AuthorService],
    }).compile();

    service = module.get<CopyService>(CopyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
