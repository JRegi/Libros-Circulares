"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditionService = void 0;
const common_1 = require("@nestjs/common");
let EditionService = class EditionService {
    create(createEditionDto) {
        return 'This action adds a new edition';
    }
    findAll() {
        return `This action returns all edition`;
    }
    findOne(id) {
        return `This action returns a #${id} edition`;
    }
    update(id, updateEditionDto) {
        return `This action updates a #${id} edition`;
    }
    remove(id) {
        return `This action removes a #${id} edition`;
    }
};
exports.EditionService = EditionService;
exports.EditionService = EditionService = __decorate([
    (0, common_1.Injectable)()
], EditionService);
//# sourceMappingURL=edition.service.js.map