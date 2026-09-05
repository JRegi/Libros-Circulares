import { Injectable } from '@nestjs/common';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { Genre } from './entities/genre.entity';

@Injectable()
export class GenreService {
  genres: Genre[] = [];

  create(createGenreDto: CreateGenreDto) {
    const newGenre = new Genre();
    newGenre.name = createGenreDto.name;
    newGenre.Id = Math.random();
    this.genres.push(newGenre);

    return newGenre.Id;
  }

  findAll() {
    return this.genres;
  }

  findOne(id: number) {
    return `This action returns a #${id} genre`;
  }

  update(id: number, updateGenreDto: UpdateGenreDto) {
    return `This action updates a #${id} genre`;
  }

  remove(id: number) {
    this.genres = this.genres.filter((g) => g.Id != id);
    return true;
  }
}
