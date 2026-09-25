import { AuthorService } from './author.service';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
export declare class AuthorController {
    private readonly authorService;
    constructor(authorService: AuthorService);
    create(createAuthorDto: CreateAuthorDto): void;
    findAll(): import("./entities/author.entity").Author[];
    findOne(id: string): import("./entities/author.entity").Author;
    update(id: string, updateAuthorDto: UpdateAuthorDto): void;
    remove(id: string): void;
}
