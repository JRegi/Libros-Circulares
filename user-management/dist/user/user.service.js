"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const user_entity_1 = require("./entities/user.entity");
const ADULT_AGE = 18;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
let UserService = class UserService {
    users = [];
    create(createUserDto) {
        if (!createUserDto) {
            throw new common_1.BadRequestException('Request body is required');
        }
        const name = this.validateText(createUserDto.name, 'name');
        const lastName = this.validateText(createUserDto.lastName, 'lastName');
        const email = this.validateEmail(createUserDto.email);
        const birthDate = this.validateBirthDate(createUserDto.birthDate);
        const dni = this.validatePositiveInteger(createUserDto.dni, 'dni');
        const phone = createUserDto.phone === undefined
            ? undefined
            : this.validatePositiveInteger(createUserDto.phone, 'phone');
        this.ensureDniIsFree(dni);
        const minor = this.isMinor(birthDate);
        if (minor && createUserDto.contactUserId === undefined) {
            throw new common_1.BadRequestException('contactUserId is required when the user is a minor');
        }
        if (createUserDto.contactUserId !== undefined) {
            this.validateContactReference(createUserDto.contactUserId, minor);
        }
        const newUser = new user_entity_1.User();
        newUser.userId = this.generateId();
        newUser.name = name;
        newUser.lastName = lastName;
        newUser.email = email;
        newUser.birthDate = birthDate;
        newUser.dni = dni;
        if (phone !== undefined) {
            newUser.phone = phone;
        }
        newUser.contactUserId = createUserDto.contactUserId;
        this.users.push(newUser);
        return { userId: newUser.userId };
    }
    findAll() {
        return this.users.map((u) => this.toView(u));
    }
    findOne(id) {
        return this.toView(this.findEntity(id));
    }
    findEntity(id) {
        const user = this.users.find((u) => u.userId == id);
        if (!user) {
            throw new common_1.NotFoundException(`User ${id} not found`);
        }
        return user;
    }
    findContact(id) {
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
    update(id, updateUserDto) {
        const user = this.findEntity(id);
        if (!updateUserDto || Object.keys(updateUserDto).length === 0) {
            throw new common_1.BadRequestException('No parameters to change were provided');
        }
        if ('userId' in updateUserDto) {
            throw new common_1.BadRequestException('userId cannot be changed');
        }
        const name = updateUserDto.name === undefined
            ? user.name
            : this.validateText(updateUserDto.name, 'name');
        const lastName = updateUserDto.lastName === undefined
            ? user.lastName
            : this.validateText(updateUserDto.lastName, 'lastName');
        const email = updateUserDto.email === undefined
            ? user.email
            : this.validateEmail(updateUserDto.email);
        const birthDate = updateUserDto.birthDate === undefined
            ? user.birthDate
            : this.validateBirthDate(updateUserDto.birthDate);
        const dni = updateUserDto.dni === undefined
            ? user.dni
            : this.validatePositiveInteger(updateUserDto.dni, 'dni');
        const phone = updateUserDto.phone === undefined
            ? user.phone
            : this.validatePositiveInteger(updateUserDto.phone, 'phone');
        const contactUserId = updateUserDto.contactUserId === undefined
            ? user.contactUserId
            : (updateUserDto.contactUserId ?? undefined);
        if (dni != user.dni) {
            this.ensureDniIsFree(dni);
        }
        const minor = this.isMinor(birthDate);
        if (minor && contactUserId === undefined) {
            throw new common_1.BadRequestException('A minor must keep a contact reference (contactUserId)');
        }
        if (contactUserId !== undefined) {
            this.validateContactReference(contactUserId, minor, user.userId);
        }
        const dependants = this.users.filter((u) => u.contactUserId == user.userId);
        if (contactUserId !== undefined && dependants.length > 0) {
            throw new common_1.ConflictException('Users that are used as a contact reference cannot reference another user');
        }
        if (minor && dependants.some((u) => this.isMinor(u.birthDate))) {
            throw new common_1.ConflictException('This user is the contact reference of a minor and must be an adult');
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
    remove(id) {
        const user = this.findEntity(id);
        if (this.users.some((u) => u.contactUserId == user.userId)) {
            throw new common_1.ConflictException('This user is the contact reference of other users; change their contact first');
        }
        for (const community of user.communities) {
            community.members = community.members.filter((m) => m.userId != user.userId);
        }
        user.communities = [];
        this.users = this.users.filter((u) => u.userId != id);
        return { message: `User ${id} unregistered` };
    }
    toView(user) {
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
    generateId() {
        let id;
        do {
            id = Math.floor(Math.random() * 1_000_000_000) + 1;
        } while (this.users.some((u) => u.userId == id));
        return id;
    }
    ensureDniIsFree(dni) {
        if (this.users.some((u) => u.dni == dni)) {
            throw new common_1.ConflictException(`DNI ${dni} is already in use`);
        }
    }
    validateContactReference(contactUserId, minor, selfId) {
        const id = this.validatePositiveInteger(contactUserId, 'contactUserId');
        if (id == selfId) {
            throw new common_1.BadRequestException('A user cannot reference itself');
        }
        const contact = this.findEntity(id);
        if (contact.contactUserId !== undefined) {
            throw new common_1.BadRequestException('The referenced user must have its own contact information');
        }
        if (minor && this.isMinor(contact.birthDate)) {
            throw new common_1.BadRequestException('The contact reference of a minor must be an adult');
        }
    }
    isMinor(birthDate) {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const birthdayPending = today.getMonth() < birthDate.getMonth() ||
            (today.getMonth() == birthDate.getMonth() &&
                today.getDate() < birthDate.getDate());
        if (birthdayPending) {
            age--;
        }
        return age < ADULT_AGE;
    }
    validateText(value, field) {
        if (typeof value !== 'string' || value.trim() === '') {
            throw new common_1.BadRequestException(`${field} must be a non-empty string`);
        }
        return value.trim();
    }
    validateEmail(value) {
        const email = this.validateText(value, 'email');
        if (!EMAIL_REGEX.test(email)) {
            throw new common_1.BadRequestException('email is not valid');
        }
        return email;
    }
    validateBirthDate(value) {
        if (typeof value !== 'string') {
            throw new common_1.BadRequestException('birthDate must be a date string');
        }
        const date = new Date(value);
        if (isNaN(date.getTime())) {
            throw new common_1.BadRequestException('birthDate is not a valid date');
        }
        if (date > new Date()) {
            throw new common_1.BadRequestException('birthDate cannot be in the future');
        }
        return date;
    }
    validatePositiveInteger(value, field) {
        if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
            throw new common_1.BadRequestException(`${field} must be a positive integer`);
        }
        return value;
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)()
], UserService);
//# sourceMappingURL=user.service.js.map