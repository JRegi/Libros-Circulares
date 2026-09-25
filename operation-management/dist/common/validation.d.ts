export declare function ensureKnownFields(dto: unknown, allowed: readonly string[]): void;
export declare function validatePositiveInteger(value: unknown, field: string): number;
export declare function readPositiveIntegers<K extends string>(dto: unknown, fields: readonly K[]): Record<K, number>;
export declare function generateId(isTaken: (id: number) => boolean): number;
