import { Genre } from '../../genre/entities/genre.entity';

export class Book {
  id: number;
  name: string;
  genre: Genre;
}
