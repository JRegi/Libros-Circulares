import { Book } from '../../book/entities/book.entity';
import { Publisher } from '../../publisher/entities/publisher.entity';

export class Edition {
  id: number;
  year: number;
  book: Book;
  publisher: Publisher;
}
