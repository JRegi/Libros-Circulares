"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationService = void 0;
const common_1 = require("@nestjs/common");
const operation_entity_1 = require("./entities/operation.entity");
const copy_service_1 = require("../copy/copy.service");
const community_service_1 = require("../community/community.service");
const validation_1 = require("../common/validation");
let OperationService = class OperationService {
    copyService;
    communityService;
    constructor(copyService, communityService) {
        this.copyService = copyService;
        this.communityService = communityService;
    }
    operations = [];
    loan(createLoanDto) {
        const { copyId, fromUserId, toUserId, communityId } = (0, validation_1.readPositiveIntegers)(createLoanDto, ['copyId', 'fromUserId', 'toUserId', 'communityId']);
        this.ensureDifferentUsers(fromUserId, toUserId);
        const copy = this.findActiveCopy(copyId);
        if (copy.holderUserId != fromUserId) {
            throw new common_1.ForbiddenException(`User ${fromUserId} does not currently have copy ${copyId}`);
        }
        this.ensureCanOperateTogether(fromUserId, toUserId, communityId);
        this.copyService.setHolder(copyId, toUserId);
        return this.register(operation_entity_1.OperationType.LOAN, copyId, fromUserId, toUserId, communityId);
    }
    return(createReturnDto) {
        const { copyId, fromUserId, communityId } = (0, validation_1.readPositiveIntegers)(createReturnDto, ['copyId', 'fromUserId', 'communityId']);
        const copy = this.findActiveCopy(copyId);
        if (copy.holderUserId != fromUserId) {
            throw new common_1.ForbiddenException(`User ${fromUserId} does not currently have copy ${copyId}`);
        }
        if (copy.ownerUserId === undefined) {
            throw new common_1.ConflictException(`Copy ${copyId} has no current owner`);
        }
        if (copy.ownerUserId == fromUserId) {
            throw new common_1.ConflictException(`Copy ${copyId} is not on loan: it is already with its owner`);
        }
        this.ensureCanOperateTogether(fromUserId, copy.ownerUserId, communityId);
        this.copyService.setHolder(copyId, copy.ownerUserId);
        return this.register(operation_entity_1.OperationType.RETURN, copyId, fromUserId, copy.ownerUserId, communityId);
    }
    transferOwnership(createOwnershipTransferDto) {
        const { copyId, fromUserId, toUserId, communityId } = (0, validation_1.readPositiveIntegers)(createOwnershipTransferDto, ['copyId', 'fromUserId', 'toUserId', 'communityId']);
        this.ensureDifferentUsers(fromUserId, toUserId);
        const copy = this.findActiveCopy(copyId);
        if (copy.ownerUserId != fromUserId) {
            throw new common_1.ForbiddenException(`User ${fromUserId} is not the current owner of copy ${copyId}`);
        }
        this.ensureCanOperateTogether(fromUserId, toUserId, communityId);
        this.copyService.setOwner(copyId, toUserId);
        return this.register(operation_entity_1.OperationType.OWNERSHIP_TRANSFER, copyId, fromUserId, toUserId, communityId);
    }
    decommission(createDecommissionDto) {
        const { copyId, userId } = (0, validation_1.readPositiveIntegers)(createDecommissionDto, [
            'copyId',
            'userId',
        ]);
        const copy = this.findActiveCopy(copyId);
        if (copy.ownerUserId != userId) {
            throw new common_1.ForbiddenException(`Only the current owner can decommission copy ${copyId}`);
        }
        this.copyService.decommission(copyId);
        return this.register(operation_entity_1.OperationType.DECOMMISSION, copyId, userId);
    }
    findAll() {
        return this.operations.map((o) => ({ ...o }));
    }
    findOne(operationId) {
        const operation = this.operations.find((o) => o.operationId == operationId);
        if (!operation) {
            throw new common_1.NotFoundException(`Operation ${operationId} not found`);
        }
        return { ...operation };
    }
    hasOpenOperations(userId, communityId) {
        return this.copyService.findAll().some((copy) => {
            if (!copy.active || copy.holderUserId == copy.ownerUserId) {
                return false;
            }
            if (copy.ownerUserId != userId && copy.holderUserId != userId) {
                return false;
            }
            return (communityId === undefined ||
                this.lastLoanOf(copy.copyId)?.communityId == communityId);
        });
    }
    lastLoanOf(copyId) {
        return this.operations.findLast((o) => o.copyId == copyId && o.type == operation_entity_1.OperationType.LOAN);
    }
    findActiveCopy(copyId) {
        const copy = this.copyService.findOne(copyId);
        if (!copy.active) {
            throw new common_1.ConflictException(`Copy ${copyId} has been decommissioned`);
        }
        return copy;
    }
    ensureDifferentUsers(fromUserId, toUserId) {
        if (fromUserId == toUserId) {
            throw new common_1.BadRequestException('fromUserId and toUserId must be different users');
        }
    }
    ensureCanOperateTogether(userId1, userId2, communityId) {
        if (!this.communityService.canOperateTogether(userId1, userId2, communityId)) {
            throw new common_1.ForbiddenException(`Users ${userId1} and ${userId2} are not both active members of community ${communityId}`);
        }
    }
    register(type, copyId, fromUserId, toUserId, communityId) {
        const operation = new operation_entity_1.Operation();
        operation.operationId = (0, validation_1.generateId)((id) => this.operations.some((o) => o.operationId == id));
        operation.type = type;
        operation.copyId = copyId;
        operation.fromUserId = fromUserId;
        operation.toUserId = toUserId;
        operation.communityId = communityId;
        operation.date = new Date();
        this.operations.push(operation);
        return { operationId: operation.operationId };
    }
};
exports.OperationService = OperationService;
exports.OperationService = OperationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [copy_service_1.CopyService,
        community_service_1.CommunityService])
], OperationService);
//# sourceMappingURL=operation.service.js.map