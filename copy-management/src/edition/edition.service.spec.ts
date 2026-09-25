import { Test, TestingModule } from '@nestjs/testing';
import { EditionService } from './edition.service';
import { WorkService } from '../work/work.service';
import { AuthorService } from '../author/author.service';

describe('EditionService', () => {
  let service: EditionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EditionService, WorkService, AuthorService],
    }).compile();

    service = module.get<EditionService>(EditionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
