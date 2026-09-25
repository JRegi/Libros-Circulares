import { BadRequestException } from '@nestjs/common';

export function ensureKnownFields(dto: unknown, allowed: readonly string[]) {
  if (!dto || typeof dto !== 'object') {
    throw new BadRequestException('Request body is required');
  }
  const unknown = Object.keys(dto).filter((k) => !allowed.includes(k));
  if (unknown.length > 0) {
    throw new BadRequestException(`Unknown fields: ${unknown.join(', ')}`);
  }
}

export function validatePositiveInteger(value: unknown, field: string) {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new BadRequestException(`${field} must be a positive integer`);
  }
  return value;
}

// Checks that the body only has `fields` and that all of them are positive
// integers, and returns them typed.
export function readPositiveIntegers<K extends string>(
  dto: unknown,
  fields: readonly K[],
) {
  ensureKnownFields(dto, fields);
  const values = {} as Record<K, number>;
  for (const field of fields) {
    values[field] = validatePositiveInteger(
      (dto as Record<string, unknown>)[field],
      field,
    );
  }
  return values;
}

export function generateId(isTaken: (id: number) => boolean) {
  let id: number;
  do {
    id = Math.floor(Math.random() * 1_000_000_000) + 1;
  } while (isTaken(id));
  return id;
}
