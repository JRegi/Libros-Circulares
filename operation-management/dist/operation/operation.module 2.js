"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationModule = void 0;
const common_1 = require("@nestjs/common");
const operation_service_1 = require("./operation.service");
const operation_controller_1 = require("./operation.controller");
const copy_module_1 = require("../copy/copy.module");
const community_module_1 = require("../community/community.module");
let OperationModule = class OperationModule {
};
exports.OperationModule = OperationModule;
exports.OperationModule = OperationModule = __decorate([
    (0, common_1.Module)({
        imports: [copy_module_1.CopyModule, community_module_1.CommunityModule],
        controllers: [operation_controller_1.OperationController],
        providers: [operation_service_1.OperationService],
    })
], OperationModule);
//# sourceMappingURL=operation.module.js.map