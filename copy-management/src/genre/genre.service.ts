import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { Genre } from './entities/genre.entity';

@Injectable()
export class GenreService {
  genres: Genre[] = [];

  create(createGenreDto: CreateGenreDto) {
    const newGenre = new Genre();
    newGenre.name = createGenreDto.name;
    newGenre.id = Math.floor(1000 + Math.random() * 9000);
    this.genres.push(newGenre);

    return newGenre.id;
  }

  findAll() {
    return this.genres;
  }

  findOne(id: number) {
    const genre = this.genres.find((g) => g.id == id);

    if (!genre) {
      throw new NotFoundException();
    }

    return genre;
  }

  update(id: number, updateGenreDto: UpdateGenreDto) {
    const genre = this.genres.find((g) => g.id == id);

    if (!genre) {
      throw new NotFoundException();
    }

    genre.name = updateGenreDto.name;
  }

  remove(id: number) {
    this.genres = this.genres.filter((g) => g.id != id);
    return true;
  }
}
