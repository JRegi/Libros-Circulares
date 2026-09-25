import { Test, TestingModule } from '@nestjs/testing';
import { CopyController } from './copy.controller';
import { CopyService } from './copy.service';
import { UserClient } from './clients/user.client';
import { EditionService } from '../edition/edition.service';
import { WorkService } from '../work/work.service';
import { AuthorService } from '../author/author.service';

describe('CopyController', () => {
  let controller: CopyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CopyController],
      providers: [CopyService, UserClient, EditionService, WorkService, AuthorService],
    }).compile();

    controller = module.get<CopyController>(CopyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
