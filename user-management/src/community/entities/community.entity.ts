import { User } from '../../user/entities/user.entity';

export class Community {
  communityId: number;
  name: string;
  members: User[] = [];
}
