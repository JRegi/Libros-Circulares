import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateLoanDto } from './dto/create-loan.dto';
import { CreateReturnDto } from './dto/create-return.dto';
import { CreateOwnershipTransferDto } from './dto/create-ownership-transfer.dto';
import { CreateDecommissionDto } from './dto/create-decommission.dto';
import { Operation, OperationType } from './entities/operation.entity';
import { CopyService } from '../copy/copy.service';
import { CommunityService } from '../community/community.service';
import { generateId, readPositiveIntegers } from '../common/validation';

@Injectable()
export class OperationService {
  constructor(
    private readonly copyService: CopyService,
    private readonly communityService: CommunityService,
  ) {}

  operations: Operation[] = [];

  loan(createLoanDto: CreateLoanDto) {
    const { copyId, fromUserId, toUserId, communityId } = readPositiveIntegers(
      createLoanDto,
      ['copyId', 'fromUserId', 'toUserId', 'communityId'],
    );
    this.ensureDifferentUsers(fromUserId, toUserId);

    const copy = this.findActiveCopy(copyId);
    // Being the owner is not enough: only the current holder can lend it.
    if (copy.holderUserId != fromUserId) {
      throw new ForbiddenException(
        `User ${fromUserId} does not currently have copy ${copyId}`,
      );
    }
    this.ensureCanOperateTogether(fromUserId, toUserId, communityId);

    this.copyService.setHolder(copyId, toUserId);

    return this.register(
      OperationType.LOAN,
      copyId,
      fromUserId,
      toUserId,
      communityId,
    );
  }

  return(createReturnDto: CreateReturnDto) {
    const { copyId, fromUserId, communityId } = readPositiveIntegers(
      createReturnDto,
      ['copyId', 'fromUserId', 'communityId'],
    );

    const copy = this.findActiveCopy(copyId);
    if (copy.holderUserId != fromUserId) {
      throw new ForbiddenException(
        `User ${fromUserId} does not currently have copy ${copyId}`,
      );
    }
    if (copy.ownerUserId === undefined) {
      throw new ConflictException(`Copy ${copyId} has no current owner`);
    }
    if (copy.ownerUserId == fromUserId) {
      throw new ConflictException(
        `Copy ${copyId} is not on loan: it is already with its owner`,
      );
    }
    this.ensureCanOperateTogether(fromUserId, copy.ownerUserId, communityId);

    this.copyService.setHolder(copyId, copy.ownerUserId);

    return this.register(
      OperationType.RETURN,
      copyId,
      fromUserId,
      copy.ownerUserId,
      communityId,
    );
  }

  transferOwnership(createOwnershipTransferDto: CreateOwnershipTransferDto) {
    const { copyId, fromUserId, toUserId, communityId } = readPositiveIntegers(
      createOwnershipTransferDto,
      ['copyId', 'fromUserId', 'toUserId', 'communityId'],
    );
    this.ensureDifferentUsers(fromUserId, toUserId);

    // The owner doesn't need to have the copy: the holder stays the same.
    const copy = this.findActiveCopy(copyId);
    if (copy.ownerUserId != fromUserId) {
      throw new ForbiddenException(
        `User ${fromUserId} is not the current owner of copy ${copyId}`,
      );
    }
    this.ensureCanOperateTogether(fromUserId, toUserId, communityId);

    this.copyService.setOwner(copyId, toUserId);

    return this.register(
      OperationType.OWNERSHIP_TRANSFER,
      copyId,
      fromUserId,
      toUserId,
      communityId,
    );
  }

  decommission(createDecommissionDto: CreateDecommissionDto) {
    const { copyId, userId } = readPositiveIntegers(createDecommissionDto, [
      'copyId',
      'userId',
    ]);

    // Only the owner can decommission a copy, whether or not they have it.
    const copy = this.findActiveCopy(copyId);
    if (copy.ownerUserId != userId) {
      throw new ForbiddenException(
        `Only the current owner can decommission copy ${copyId}`,
      );
    }

    this.copyService.decommission(copyId);

    return this.register(OperationType.DECOMMISSION, copyId, userId);
  }

  findAll() {
    return this.operations.map((o) => ({ ...o }));
  }

  findOne(operationId: number) {
    const operation = this.operations.find((o) => o.operationId == operationId);

    if (!operation) {
      throw new NotFoundException(`Operation ${operationId} not found`);
    }

    return { ...operation };
  }

  // Used by user-management before unregistering a user or leaving a
  // community. A loan stays open while an active copy is away from its owner;
  // it involves the owner and the holder, in the community of its last loan.
  hasOpenOperations(userId: number, communityId?: number) {
    return this.copyService.findAll().some((copy) => {
      if (!copy.active || copy.holderUserId == copy.ownerUserId) {
        return false;
      }
      if (copy.ownerUserId != userId && copy.holderUserId != userId) {
        return false;
      }
      return (
        communityId === undefined ||
        this.lastLoanOf(copy.copyId)?.communityId == communityId
      );
    });
  }

  private lastLoanOf(copyId: number) {
    return this.operations.findLast(
      (o) => o.copyId == copyId && o.type == OperationType.LOAN,
    );
  }

  private findActiveCopy(copyId: number) {
    const copy = this.copyService.findOne(copyId);

    if (!copy.active) {
      throw new ConflictException(`Copy ${copyId} has been decommissioned`);
    }

    return copy;
  }

  private ensureDifferentUsers(fromUserId: number, toUserId: number) {
    if (fromUserId == toUserId) {
      throw new BadRequestException(
        'fromUserId and toUserId must be different users',
      );
    }
  }

  private ensureCanOperateTogether(
    userId1: number,
    userId2: number,
    communityId: number,
  ) {
    if (
      !this.communityService.canOperateTogether(userId1, userId2, communityId)
    ) {
      throw new ForbiddenException(
        `Users ${userId1} and ${userId2} are not both active members of community ${communityId}`,
      );
    }
  }

  private register(
    type: OperationType,
    copyId: number,
    fromUserId: number,
    toUserId?: number,
    communityId?: number,
  ) {
    const operation = new Operation();
    operation.operationId = generateId((id) =>
      this.operations.some((o) => o.operationId == id),
    );
    operation.type = type;
    operation.copyId = copyId;
    operation.fromUserId = fromUserId;
    operation.toUserId = toUserId;
    operation.communityId = communityId;
    operation.date = new Date();
    this.operations.push(operation);

    return { operationId: operation.operationId };
  }
}
