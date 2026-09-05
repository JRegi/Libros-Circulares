"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCopyDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_copy_dto_1 = require("./create-copy.dto");
class UpdateCopyDto extends (0, mapped_types_1.PartialType)(create_copy_dto_1.CreateCopyDto) {
}
exports.UpdateCopyDto = UpdateCopyDto;
//# sourceMappingURL=update-copy.dto.js.map