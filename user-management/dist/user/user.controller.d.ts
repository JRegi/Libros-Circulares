import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
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
}
