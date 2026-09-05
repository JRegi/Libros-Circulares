import { CreateCopyDto } from './dto/create-copy.dto';
import { UpdateCopyDto } from './dto/update-copy.dto';
export declare class CopyService {
    create(createCopyDto: CreateCopyDto): string;
    findAll(): string;
    findOne(id: number): string;
    update(id: number, updateCopyDto: UpdateCopyDto): string;
    remove(id: number): string;
}
