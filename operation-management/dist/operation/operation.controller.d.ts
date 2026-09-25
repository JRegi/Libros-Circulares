import { OperationService } from './operation.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { CreateReturnDto } from './dto/create-return.dto';
import { CreateOwnershipTransferDto } from './dto/create-ownership-transfer.dto';
import { CreateDecommissionDto } from './dto/create-decommission.dto';
export declare class OperationController {
    private readonly operationService;
    constructor(operationService: OperationService);
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
        type: import("./entities/operation.entity").OperationType;
        copyId: number;
        fromUserId: number;
        toUserId?: number;
        communityId?: number;
        date: Date;
    }[];
    hasOpenOperations(userId: number, communityId?: number): {
        hasOpenOperations: boolean;
    };
    findOne(id: number): {
        operationId: number;
        type: import("./entities/operation.entity").OperationType;
        copyId: number;
        fromUserId: number;
        toUserId?: number;
        communityId?: number;
        date: Date;
    };
}
