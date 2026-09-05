import { Book } from '../../book/entities/book.entity';
import { Publisher } from '../../publisher/entities/publisher.entity';
export declare class Edition {
    Id: number;
    year: number;
    book: Book;
    publisher: Publisher;
}
