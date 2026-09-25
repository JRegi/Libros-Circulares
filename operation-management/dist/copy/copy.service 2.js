"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CopyService = void 0;
const common_1 = require("@nestjs/common");
const copy_entity_1 = require("./entities/copy.entity");
const validation_1 = require("../common/validation");
let CopyService = class CopyService {
    copies = [];
    create(createCopyDto) {
        const { ownerUserId } = (0, validation_1.readPositiveIntegers)(createCopyDto, [
            'ownerUserId',
        ]);
        const copy = new copy_entity_1.Copy();
        copy.copyId = (0, validation_1.generateId)((id) => this.copies.some((c) => c.copyId == id));
        copy.ownerUserId = ownerUserId;
        copy.holderUserId = ownerUserId;
        copy.active = true;
        this.copies.push(copy);
        return { copyId: copy.copyId };
    }
    findAll() {
        return this.copies.map((c) => ({ ...c }));
    }
    findOne(copyId) {
        return { ...this.findEntity(copyId) };
    }
    setHolder(copyId, userId) {
        this.findEntity(copyId).holderUserId = userId;
    }
    setOwner(copyId, userId) {
        this.findEntity(copyId).ownerUserId = userId;
    }
    decommission(copyId) {
        this.findEntity(copyId).active = false;
    }
    findEntity(copyId) {
        const copy = this.copies.find((c) => c.copyId == copyId);
        if (!copy) {
            throw new common_1.NotFoundException(`Copy ${copyId} not found`);
        }
        return copy;
    }
};
exports.CopyService = CopyService;
exports.CopyService = CopyService = __decorate([
    (0, common_1.Injectable)()
], CopyService);
//# sourceMappingURL=copy.service.js.map