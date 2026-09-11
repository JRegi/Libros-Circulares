import { CreateGenreDto } from './create-genre.dto';
declare const UpdateGenreDto_base: import("@nestjs/mapped-types", { with: { "resolution-mode": "import" } }).MappedType<Partial<CreateGenreDto>>;
export declare class UpdateGenreDto extends UpdateGenreDto_base {
    name: string;
}
export {};
