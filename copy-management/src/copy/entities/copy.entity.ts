import { Edition } from '../../edition/entities/edition.entity';

export class Copy {
  Id: number;
  edition: Edition;
  ownerId: number;
}
