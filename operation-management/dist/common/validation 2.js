"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureKnownFields = ensureKnownFields;
exports.validatePositiveInteger = validatePositiveInteger;
exports.readPositiveIntegers = readPositiveIntegers;
exports.generateId = generateId;
const common_1 = require("@nestjs/common");
function ensureKnownFields(dto, allowed) {
    if (!dto || typeof dto !== 'object') {
        throw new common_1.BadRequestException('Request body is required');
    }
    const unknown = Object.keys(dto).filter((k) => !allowed.includes(k));
    if (unknown.length > 0) {
        throw new common_1.BadRequestException(`Unknown fields: ${unknown.join(', ')}`);
    }
}
function validatePositiveInteger(value, field) {
    if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
        throw new common_1.BadRequestException(`${field} must be a positive integer`);
    }
    return value;
}
function readPositiveIntegers(dto, fields) {
    ensureKnownFields(dto, fields);
    const values = {};
    for (const field of fields) {
        values[field] = validatePositiveInteger(dto[field], field);
    }
    return values;
}
function generateId(isTaken) {
    let id;
    do {
        id = Math.floor(Math.random() * 1_000_000_000) + 1;
    } while (isTaken(id));
    return id;
}
//# sourceMappingURL=validation.js.map