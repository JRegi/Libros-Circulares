import { BadRequestException } from '@nestjs/common';

export function requireBody(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new BadRequestException('Request body is required');
  }
  return body as Record<string, unknown>;
}

export function rejectUnknownFields(body: object, allowed: string[]) {
  const unknown = Object.keys(body).filter((k) => !allowed.includes(k));
  if (unknown.length > 0) {
    throw new BadRequestException(`Unknown fields: ${unknown.join(', ')}`);
  }
}

export function validateText(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new BadRequestException(`${field} must be a non-empty string`);
  }
  return value.trim();
}

export function validateId(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) {
    throw new BadRequestException(`${field} must be a positive integer`);
  }
  return value;
}

export function generateId(isTaken: (id: number) => boolean): number {
  let id: number;
  do {
    id = Math.floor(Math.random() * 1_000_000_000) + 1;
  } while (isTaken(id));
  return id;
}
