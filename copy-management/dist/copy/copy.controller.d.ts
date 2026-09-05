import { CopyService } from './copy.service';
import { CreateCopyDto } from './dto/create-copy.dto';
import { UpdateCopyDto } from './dto/update-copy.dto';
export declare class CopyController {
    private readonly copyService;
    constructor(copyService: CopyService);
    create(createCopyDto: CreateCopyDto): string;
    findAll(): string;
    findOne(id: string): string;
    update(id: string, updateCopyDto: UpdateCopyDto): string;
    remove(id: string): string;
}
