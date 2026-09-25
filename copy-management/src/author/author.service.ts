import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAuthorDto } from './dto/create-author.dto';
import { Author } from './entities/author.entity';
import {
  generateId,
  rejectUnknownFields,
  requireBody,
  validateText,
} from '../common/validation';

const AUTHOR_FIELDS = ['name', 'lastName', 'nationality', 'countryOfResidence'];

@Injectable()
export class AuthorService {
  authors: Author[] = [];

  create(createAuthorDto: CreateAuthorDto) {
    const body = requireBody(createAuthorDto);
    rejectUnknownFields(body, AUTHOR_FIELDS);

    const newAuthor = new Author();
    newAuthor.name = validateText(body.name, 'name');
    newAuthor.lastName = validateText(body.lastName, 'lastName');
    newAuthor.nationality = validateText(body.nationality, 'nationality');
    newAuthor.countryOfResidence = validateText(
      body.countryOfResidence,
      'countryOfResidence',
    );
    newAuthor.authorId = generateId((id) =>
      this.authors.some((a) => a.authorId == id),
    );
    this.authors.push(newAuthor);

    return { authorId: newAuthor.authorId };
  }

  findAll() {
    return this.authors;
  }

  findOne(id: number) {
    const author = this.authors.find((a) => a.authorId == id);

    if (!author) {
      throw new NotFoundException(`Author ${id} not found`);
    }

    return author;
  }
}
