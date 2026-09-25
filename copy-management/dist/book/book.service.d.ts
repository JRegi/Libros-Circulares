import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { Book } from './entities/book.entity';
import { AuthorService } from '../author/author.service';
import { GenreService } from '../genre/genre.service';
export declare class BookService {
    private readonly authorService;
    private readonly genreService;
    constructor(authorService: AuthorService, genreService: GenreService);
    books: Book[];
    create(createBookDto: CreateBookDto): void;
    findAll(): Book[];
    findOne(id: number): Book;
    update(id: number, updateBookDto: UpdateBookDto): void;
    remove(id: number): boolean;
}
