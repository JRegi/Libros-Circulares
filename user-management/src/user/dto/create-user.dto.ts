export class CreateUserDto {
  name: string;
  lastName: string;
  email: string;
  // YYYY-MM-DD, e.g. "2001-05-23"
  birthDate: string;
  dni: number;
  phone?: number;
  // null is treated as "no contact reference"
  contactUserId?: number | null;
}
