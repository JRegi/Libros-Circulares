import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
export declare class UserService {
    users: User[];
    create(createUserDto: CreateUserDto): {
        userId: number;
    };
    findAll(): {
        userId: number;
        name: string;
        lastName: string;
        email: string;
        phone: number;
        birthDate: Date;
        dni: number;
        contactUserId: number | undefined;
        communities: {
            communityId: number;
            name: string;
        }[];
    }[];
    findOne(id: number): {
        userId: number;
        name: string;
        lastName: string;
        email: string;
        phone: number;
        birthDate: Date;
        dni: number;
        contactUserId: number | undefined;
        communities: {
            communityId: number;
            name: string;
        }[];
    };
    findEntity(id: number): User;
    findContact(id: number): {
        email: string;
        phone: number;
        contactUserId?: undefined;
    } | {
        contactUserId: number;
        email: string;
        phone: number;
    };
    update(id: number, updateUserDto: UpdateUserDto): {
        message: string;
    };
    remove(id: number): {
        message: string;
    };
    private toView;
    private generateId;
    private ensureDniIsFree;
    private validateContactReference;
    private isMinor;
    private validateText;
    private validateEmail;
    private validateBirthDate;
    private validatePositiveInteger;
}
