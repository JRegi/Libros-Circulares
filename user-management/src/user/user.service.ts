import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

const ADULT_AGE = 18;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BIRTH_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
const USER_FIELDS = [
  'name',
  'lastName',
  'email',
  'birthDate',
  'dni',
  'phone',
  'contactUserId',
];

@Injectable()
export class UserService {
  users: User[] = [];

  create(createUserDto: CreateUserDto) {
    if (!createUserDto) {
      throw new BadRequestException('Request body is required');
    }
    this.rejectUnknownFields(createUserDto);

    const name = this.validateText(createUserDto.name, 'name');
    const lastName = this.validateText(createUserDto.lastName, 'lastName');
    const email = this.validateEmail(createUserDto.email);
    const birthDate = this.validateBirthDate(createUserDto.birthDate);
    const dni = this.validatePositiveInteger(createUserDto.dni, 'dni');
    const phone =
      createUserDto.phone === undefined
        ? undefined
        : this.validatePositiveInteger(createUserDto.phone, 'phone');

    // null is accepted as "no contact reference", same as in update()
    const contactUserId = createUserDto.contactUserId ?? undefined;

    this.ensureDniIsFree(dni);

    const minor = this.isMinor(birthDate);
    if (minor && contactUserId === undefined) {
      throw new BadRequestException(
        'contactUserId is required when the user is a minor',
      );
    }
    if (contactUserId !== undefined) {
      this.validateContactReference(contactUserId, minor);
    }

    const newUser = new User();
    newUser.userId = this.generateId();
    newUser.name = name;
    newUser.lastName = lastName;
    newUser.email = email;
    newUser.birthDate = birthDate;
    newUser.dni = dni;
    if (phone !== undefined) {
      newUser.phone = phone;
    }
    newUser.contactUserId = contactUserId;
    this.users.push(newUser);

    return { userId: newUser.userId };
  }

  findAll() {
    return this.users.map((u) => this.toView(u));
  }

  findOne(id: number) {
    return this.toView(this.findEntity(id));
  }

  // Returns the stored entity; used by other modules (e.g. CommunityService).
  findEntity(id: number) {
    const user = this.users.find((u) => u.userId == id);

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    return user;
  }

  // Effective contact information: the referenced user's when there is one.
  findContact(id: number) {
    const user = this.findEntity(id);

    if (user.contactUserId === undefined) {
      return { email: user.email, phone: user.phone };
    }

    const contact = this.findEntity(user.contactUserId);
    return {
      contactUserId: contact.userId,
      email: contact.email,
      phone: contact.phone,
    };
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    const user = this.findEntity(id);

    if (!updateUserDto || Object.keys(updateUserDto).length === 0) {
      throw new BadRequestException('No parameters to change were provided');
    }
    if ('userId' in updateUserDto) {
      throw new BadRequestException('userId cannot be changed');
    }
    this.rejectUnknownFields(updateUserDto);

    // Validate everything first so that a failed request changes nothing.
    const name =
      updateUserDto.name === undefined
        ? user.name
        : this.validateText(updateUserDto.name, 'name');
    const lastName =
      updateUserDto.lastName === undefined
        ? user.lastName
        : this.validateText(updateUserDto.lastName, 'lastName');
    const email =
      updateUserDto.email === undefined
        ? user.email
        : this.validateEmail(updateUserDto.email);
    const birthDate =
      updateUserDto.birthDate === undefined
        ? user.birthDate
        : this.validateBirthDate(updateUserDto.birthDate);
    const dni =
      updateUserDto.dni === undefined
        ? user.dni
        : this.validatePositiveInteger(updateUserDto.dni, 'dni');
    const phone =
      updateUserDto.phone === undefined
        ? user.phone
        : this.validatePositiveInteger(updateUserDto.phone, 'phone');
    const contactUserId =
      updateUserDto.contactUserId === undefined
        ? user.contactUserId
        : (updateUserDto.contactUserId ?? undefined);

    if (dni != user.dni) {
      this.ensureDniIsFree(dni);
    }

    const minor = this.isMinor(birthDate);
    if (minor && contactUserId === undefined) {
      throw new BadRequestException(
        'A minor must keep a contact reference (contactUserId)',
      );
    }
    if (contactUserId !== undefined) {
      this.validateContactReference(contactUserId, minor, user.userId);
    }

    // A user that others rely on for contact can't reference anyone. Since a
    // minor must reference someone, this also keeps such a user an adult.
    const isReferenced = this.users.some((u) => u.contactUserId == user.userId);
    if (contactUserId !== undefined && isReferenced) {
      throw new ConflictException(
        'Users that are used as a contact reference cannot reference another user',
      );
    }

    user.name = name;
    user.lastName = lastName;
    user.email = email;
    user.birthDate = birthDate;
    user.dni = dni;
    user.phone = phone;
    user.contactUserId = contactUserId;

    return { message: `User ${id} updated` };
  }

  remove(id: number) {
    const user = this.findEntity(id);

    // TODO: once operation-management exists, fail here if the user still has
    // open operations ("All operations must be successfully closed").

    if (this.users.some((u) => u.contactUserId == user.userId)) {
      throw new ConflictException(
        'This user is the contact reference of other users; change their contact first',
      );
    }

    for (const community of user.communities) {
      community.members = community.members.filter(
        (m) => m.userId != user.userId,
      );
    }
    user.communities = [];
    this.users = this.users.filter((u) => u.userId != id);

    return { message: `User ${id} unregistered` };
  }

  private toView(user: User) {
    return {
      userId: user.userId,
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      birthDate: user.birthDate,
      dni: user.dni,
      contactUserId: user.contactUserId,
      communities: user.communities.map((c) => ({
        communityId: c.communityId,
        name: c.name,
      })),
    };
  }

  private generateId() {
    let id: number;
    do {
      id = Math.floor(Math.random() * 1_000_000_000) + 1;
    } while (this.users.some((u) => u.userId == id));
    return id;
  }

  private ensureDniIsFree(dni: number) {
    if (this.users.some((u) => u.dni == dni)) {
      throw new ConflictException(`DNI ${dni} is already in use`);
    }
  }

  private validateContactReference(
    contactUserId: unknown,
    minor: boolean,
    selfId?: number,
  ) {
    const id = this.validatePositiveInteger(contactUserId, 'contactUserId');

    if (id == selfId) {
      throw new BadRequestException('A user cannot reference itself');
    }

    const contact = this.findEntity(id);

    if (contact.contactUserId !== undefined) {
      throw new BadRequestException(
        'The referenced user must have its own contact information',
      );
    }
    if (minor && this.isMinor(contact.birthDate)) {
      throw new BadRequestException(
        'The contact reference of a minor must be an adult',
      );
    }
  }

  // Birth dates are stored as UTC midnight, so they are read with the UTC
  // getters; "today" is the server's local calendar date.
  private isMinor(birthDate: Date) {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getUTCFullYear();
    const birthdayPending =
      today.getMonth() < birthDate.getUTCMonth() ||
      (today.getMonth() == birthDate.getUTCMonth() &&
        today.getDate() < birthDate.getUTCDate());
    if (birthdayPending) {
      age--;
    }
    return age < ADULT_AGE;
  }

  private rejectUnknownFields(dto: object) {
    const unknown = Object.keys(dto).filter((k) => !USER_FIELDS.includes(k));
    if (unknown.length > 0) {
      throw new BadRequestException(`Unknown fields: ${unknown.join(', ')}`);
    }
  }

  private validateText(value: unknown, field: string) {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new BadRequestException(`${field} must be a non-empty string`);
    }
    return value.trim();
  }

  private validateEmail(value: unknown) {
    const email = this.validateText(value, 'email');
    if (!EMAIL_REGEX.test(email)) {
      throw new BadRequestException('email is not valid');
    }
    return email;
  }

  private validateBirthDate(value: unknown) {
    const match =
      typeof value === 'string' ? BIRTH_DATE_REGEX.exec(value) : null;
    if (!match) {
      throw new BadRequestException('birthDate must be a YYYY-MM-DD date');
    }
    const [year, month, day] = match.slice(1).map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    // Date.UTC rolls invalid days over (e.g. 2001-02-30 -> 2001-03-02)
    if (
      date.getUTCFullYear() != year ||
      date.getUTCMonth() != month - 1 ||
      date.getUTCDate() != day
    ) {
      throw new BadRequestException('birthDate is not a valid calendar date');
    }
    const now = new Date();
    if (date.getTime() > Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) {
      throw new BadRequestException('birthDate cannot be in the future');
    }
    return date;
  }

  private validatePositiveInteger(value: unknown, field: string) {
    if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${field} must be a positive integer`);
    }
    return value;
  }
}
