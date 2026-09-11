import { Edition } from '../../edition/entities/edition.entity';

export class Copy {
  id: number;
  edition: Edition;
  ownerId: number;
}
