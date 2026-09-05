import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { Genre } from './entities/genre.entity';
export declare class GenreService {
    genres: Genre[];
    create(createGenreDto: CreateGenreDto): number;
    findAll(): Genre[];
    findOne(id: number): string;
    update(id: number, updateGenreDto: UpdateGenreDto): string;
    remove(id: number): boolean;
}
