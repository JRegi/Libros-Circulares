import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateWorkDto } from './dto/create-work.dto';
import { Work } from './entities/work.entity';
import { AuthorService } from '../author/author.service';
import {
  generateId,
  rejectUnknownFields,
  requireBody,
  validateId,
  validateText,
} from '../common/validation';

const WORK_FIELDS = ['title', 'genre', 'authorIds'];

@Injectable()
export class WorkService {
  constructor(private readonly authorService: AuthorService) {}

  works: Work[] = [];

  create(createWorkDto: CreateWorkDto) {
    const body = requireBody(createWorkDto);
    rejectUnknownFields(body, WORK_FIELDS);

    const title = validateText(body.title, 'title');
    const genre = validateText(body.genre, 'genre');

    if (!Array.isArray(body.authorIds) || body.authorIds.length === 0) {
      throw new BadRequestException('authorIds must contain at least one author');
    }
    const authorIds = [
      ...new Set(body.authorIds.map((id) => validateId(id, 'authorIds'))),
    ];
    // findOne throws NotFoundException if any author does not exist
    const authors = authorIds.map((id) => this.authorService.findOne(id));

    const newWork = new Work();
    newWork.workId = generateId((id) => this.works.some((w) => w.workId == id));
    newWork.title = title;
    newWork.genre = genre;
    newWork.authors = authors;
    this.works.push(newWork);

    return { workId: newWork.workId };
  }

  findAll() {
    return this.works;
  }

  findOne(id: number) {
    const work = this.works.find((w) => w.workId == id);

    if (!work) {
      throw new NotFoundException(`Work ${id} not found`);
    }

    return work;
  }
}
