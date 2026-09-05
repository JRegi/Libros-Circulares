import { GenreService } from './genre.service';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
export declare class GenreController {
    private readonly genreService;
    constructor(genreService: GenreService);
    create(createGenreDto: CreateGenreDto): number;
    findAll(): import("./entities/genre.entity").Genre[];
    findOne(id: string): string;
    update(id: string, updateGenreDto: UpdateGenreDto): string;
    remove(id: string): boolean;
}
