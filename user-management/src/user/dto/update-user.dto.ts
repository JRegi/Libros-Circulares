export class UpdateUserDto {
  name?: string;
  lastName?: string;
  email?: string;
  // YYYY-MM-DD, e.g. "2001-05-23"
  birthDate?: string;
  dni?: number;
  phone?: number;
  // null removes the contact reference (only allowed for adults)
  contactUserId?: number | null;
}
