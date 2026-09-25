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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationController = void 0;
const common_1 = require("@nestjs/common");
const operation_service_1 = require("./operation.service");
const create_loan_dto_1 = require("./dto/create-loan.dto");
const create_return_dto_1 = require("./dto/create-return.dto");
const create_ownership_transfer_dto_1 = require("./dto/create-ownership-transfer.dto");
const create_decommission_dto_1 = require("./dto/create-decommission.dto");
let OperationController = class OperationController {
    operationService;
    constructor(operationService) {
        this.operationService = operationService;
    }
    loan(createLoanDto) {
        return this.operationService.loan(createLoanDto);
    }
    return(createReturnDto) {
        return this.operationService.return(createReturnDto);
    }
    transferOwnership(createOwnershipTransferDto) {
        return this.operationService.transferOwnership(createOwnershipTransferDto);
    }
    decommission(createDecommissionDto) {
        return this.operationService.decommission(createDecommissionDto);
    }
    findAll() {
        return this.operationService.findAll();
    }
    hasOpenOperations(userId, communityId) {
        return {
            hasOpenOperations: this.operationService.hasOpenOperations(userId, communityId),
        };
    }
    findOne(id) {
        return this.operationService.findOne(id);
    }
};
exports.OperationController = OperationController;
__decorate([
    (0, common_1.Post)('loan'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_loan_dto_1.CreateLoanDto]),
    __metadata("design:returntype", void 0)
], OperationController.prototype, "loan", null);
__decorate([
    (0, common_1.Post)('return'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_return_dto_1.CreateReturnDto]),
    __metadata("design:returntype", void 0)
], OperationController.prototype, "return", null);
__decorate([
    (0, common_1.Post)('ownership-transfer'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_ownership_transfer_dto_1.CreateOwnershipTransferDto]),
    __metadata("design:returntype", void 0)
], OperationController.prototype, "transferOwnership", null);
__decorate([
    (0, common_1.Post)('decommission'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_decommission_dto_1.CreateDecommissionDto]),
    __metadata("design:returntype", void 0)
], OperationController.prototype, "decommission", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OperationController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('open'),
    __param(0, (0, common_1.Query)('userId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('communityId', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], OperationController.prototype, "hasOpenOperations", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], OperationController.prototype, "findOne", null);
exports.OperationController = OperationController = __decorate([
    (0, common_1.Controller)('operation'),
    __metadata("design:paramtypes", [operation_service_1.OperationService])
], OperationController);
//# sourceMappingURL=operation.controller.js.map