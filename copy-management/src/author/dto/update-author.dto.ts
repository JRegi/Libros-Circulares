import { PartialType } from '@nestjs/mapped-types';
import { CreateAuthorDto } from './create-author.dto';
import { strict } from 'node:assert';

export class UpdateAuthorDto extends PartialType(CreateAuthorDto) {
  name: string;
}
