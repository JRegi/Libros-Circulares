import { CopyService } from './copy.service';
import { CreateCopyDto } from './dto/create-copy.dto';
export declare class CopyController {
    private readonly copyService;
    constructor(copyService: CopyService);
    create(createCopyDto: CreateCopyDto): {
        copyId: number;
    };
    findAll(): {
        copyId: number;
        ownerUserId: number;
        holderUserId: number;
        active: boolean;
    }[];
    findOne(id: number): {
        copyId: number;
        ownerUserId: number;
        holderUserId: number;
        active: boolean;
    };
}
