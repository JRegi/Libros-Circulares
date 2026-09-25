import { Community } from '../../community/entities/community.entity';

export class User {
  userId: number;
  name: string;
  lastName: string;
  email: string;
  phone: number;
  birthDate: Date;
  dni: number;
  // userId of the user whose contact information this user relies on.
  // Mandatory when the user is a minor.
  contactUserId?: number;
  communities: Community[] = [];
}
