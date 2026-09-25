import { CreateCopyDto } from './dto/create-copy.dto';
import { Copy } from './entities/copy.entity';
export declare class CopyService {
    copies: Copy[];
    create(createCopyDto: CreateCopyDto): {
        copyId: number;
    };
    findAll(): {
        copyId: number;
        ownerUserId: number;
        holderUserId: number;
        active: boolean;
    }[];
    findOne(copyId: number): {
        copyId: number;
        ownerUserId: number;
        holderUserId: number;
        active: boolean;
    };
    setHolder(copyId: number, userId: number): void;
    setOwner(copyId: number, userId: number): void;
    decommission(copyId: number): void;
    private findEntity;
}
