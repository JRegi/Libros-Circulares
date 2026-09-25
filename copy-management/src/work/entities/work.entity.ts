import { Author } from '../../author/entities/author.entity';

export class Work {
  workId: number;

  title: string;

  genre: string;

  authors: Author[] = [];
}
