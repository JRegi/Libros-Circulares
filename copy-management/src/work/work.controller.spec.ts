import { Test, TestingModule } from '@nestjs/testing';
import { WorkController } from './work.controller';
import { WorkService } from './work.service';
import { AuthorService } from '../author/author.service';

describe('WorkController', () => {
  let controller: WorkController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkController],
      providers: [WorkService, AuthorService],
    }).compile();

    controller = module.get<WorkController>(WorkController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
