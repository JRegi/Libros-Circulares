import { CreateLoanDto } from './dto/create-loan.dto';
import { CreateReturnDto } from './dto/create-return.dto';
import { CreateOwnershipTransferDto } from './dto/create-ownership-transfer.dto';
import { CreateDecommissionDto } from './dto/create-decommission.dto';
import { Operation, OperationType } from './entities/operation.entity';
import { CopyService } from '../copy/copy.service';
import { CommunityService } from '../community/community.service';
export declare class OperationService {
    private readonly copyService;
    private readonly communityService;
    constructor(copyService: CopyService, communityService: CommunityService);
    operations: Operation[];
    loan(createLoanDto: CreateLoanDto): {
        operationId: number;
    };
    return(createReturnDto: CreateReturnDto): {
        operationId: number;
    };
    transferOwnership(createOwnershipTransferDto: CreateOwnershipTransferDto): {
        operationId: number;
    };
    decommission(createDecommissionDto: CreateDecommissionDto): {
        operationId: number;
    };
    findAll(): {
        operationId: number;
        type: OperationType;
        copyId: number;
        fromUserId: number;
        toUserId?: number;
        communityId?: number;
        date: Date;
    }[];
    findOne(operationId: number): {
        operationId: number;
        type: OperationType;
        copyId: number;
        fromUserId: number;
        toUserId?: number;
        communityId?: number;
        date: Date;
    };
    hasOpenOperations(userId: number, communityId?: number): boolean;
    private lastLoanOf;
    private findActiveCopy;
    private ensureDifferentUsers;
    private ensureCanOperateTogether;
    private register;
}
