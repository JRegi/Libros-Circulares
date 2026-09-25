import { Module } from '@nestjs/common';
import { BookService } from './book.service';
import { BookController } from './book.controller';
import { AuthorModule } from '../author/author.module';
import { GenreModule } from '../genre/genre.module';
import { AuthorService } from '../author/author.service';
import { GenreService } from '../genre/genre.service';

@Module({
  imports: [AuthorModule, GenreModule],
  controllers: [BookController],
  providers: [BookService, AuthorService, GenreService],
})
export class BookModule {}
