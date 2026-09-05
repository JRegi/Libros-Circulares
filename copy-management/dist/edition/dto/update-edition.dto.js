"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateEditionDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_edition_dto_1 = require("./create-edition.dto");
class UpdateEditionDto extends (0, mapped_types_1.PartialType)(create_edition_dto_1.CreateEditionDto) {
}
exports.UpdateEditionDto = UpdateEditionDto;
//# sourceMappingURL=update-edition.dto.js.map