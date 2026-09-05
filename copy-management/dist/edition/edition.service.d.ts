import { CreateEditionDto } from './dto/create-edition.dto';
import { UpdateEditionDto } from './dto/update-edition.dto';
export declare class EditionService {
    create(createEditionDto: CreateEditionDto): string;
    findAll(): string;
    findOne(id: number): string;
    update(id: number, updateEditionDto: UpdateEditionDto): string;
    remove(id: number): string;
}
