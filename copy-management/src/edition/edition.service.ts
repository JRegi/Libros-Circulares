import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateEditionDto } from './dto/create-edition.dto';
import { Edition } from './entities/edition.entity';
import { WorkService } from '../work/work.service';
import {
  generateId,
  rejectUnknownFields,
  requireBody,
  validateId,
  validateText,
} from '../common/validation';

const EDITION_FIELDS = ['workId', 'publisher', 'year'];

@Injectable()
export class EditionService {
  constructor(private readonly workService: WorkService) {}

  editions: Edition[] = [];

  create(createEditionDto: CreateEditionDto) {
    const body = requireBody(createEditionDto);
    rejectUnknownFields(body, EDITION_FIELDS);

    const workId = validateId(body.workId, 'workId');
    const publisher = validateText(body.publisher, 'publisher');
    const year = this.validateYear(body.year);
    // throws NotFoundException if the work does not exist
    this.workService.findOne(workId);

    const newEdition = new Edition();
    newEdition.editionId = generateId((id) =>
      this.editions.some((e) => e.editionId == id),
    );
    newEdition.workId = workId;
    newEdition.publisher = publisher;
    newEdition.year = year;
    this.editions.push(newEdition);

    return { editionId: newEdition.editionId };
  }

  findAll() {
    return this.editions;
  }

  findOne(id: number) {
    const edition = this.editions.find((e) => e.editionId == id);

    if (!edition) {
      throw new NotFoundException(`Edition ${id} not found`);
    }

    return edition;
  }

  private validateYear(value: unknown) {
    const currentYear = new Date().getFullYear();
    if (
      typeof value !== 'number' ||
      !Number.isInteger(value) ||
      value < 1 ||
      value > currentYear
    ) {
      throw new BadRequestException(
        `year must be an integer between 1 and ${currentYear}`,
      );
    }
    return value;
  }
}
