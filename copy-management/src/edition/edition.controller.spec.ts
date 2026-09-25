import { Test, TestingModule } from '@nestjs/testing';
import { EditionController } from './edition.controller';
import { EditionService } from './edition.service';
import { WorkService } from '../work/work.service';
import { AuthorService } from '../author/author.service';

describe('EditionController', () => {
  let controller: EditionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EditionController],
      providers: [EditionService, WorkService, AuthorService],
    }).compile();

    controller = module.get<EditionController>(EditionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
