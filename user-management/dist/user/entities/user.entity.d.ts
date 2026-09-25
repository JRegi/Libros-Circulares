import { Community } from '../../community/entities/community.entity';
export declare class User {
    userId: number;
    name: string;
    lastName: string;
    email: string;
    phone: number;
    birthDate: Date;
    dni: number;
    contactUserId?: number;
    communities: Community[];
}
