import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import { Author } from '../author/entities/author.entity';
export declare class AuthorService {
    authors: Author[];
    create(createAuthorDto: CreateAuthorDto): void;
    findAll(): Author[];
    findOne(id: number): Author;
    update(id: number, updateAuthorDto: UpdateAuthorDto): void;
    remove(id: number): void;
}
