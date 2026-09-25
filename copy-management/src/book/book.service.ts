import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { Book } from './entities/book.entity';
import { Author } from '../author/entities/author.entity';
import { AuthorService } from '../author/author.service';
import { GenreService } from '../genre/genre.service';

@Injectable()
export class BookService {
  constructor(
    private readonly authorService: AuthorService,
    private readonly genreService: GenreService,
  ) {}

  books: Book[] = [];

  create(createBookDto: CreateBookDto) {
    const genre = this.genreService.findOne(createBookDto.genreId);
    const authors = createBookDto.authorsId.map((a) =>
      this.authorService.findOne(a),
    );
    const newBook = new Book();
    newBook.name = createBookDto.name;
    newBook.genre = genre;
    newBook.authors = authors;
    newBook.id = Math.random();
    this.books.push(newBook);
  }

  findAll() {
    return this.books;
  }

  findOne(id: number) {
    const book = this.books.find((g) => g.id == id);

    if (!book) {
      throw new NotFoundException();
    }

    return book;
  }

  update(id: number, updateBookDto: UpdateBookDto) {
    const book = this.books.find((g) => g.id == id);

    if (!book) {
      throw new NotFoundException();
    }

    if (updateBookDto.name) {
      book.name = updateBookDto.name;
    }
  }

  remove(id: number) {
    this.books = this.books.filter((b) => b.id != id);
    return true;
  }
}
