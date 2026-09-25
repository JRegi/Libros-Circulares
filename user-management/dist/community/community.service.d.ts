import { CreateCommunityDto } from './dto/create-community.dto';
import { Community } from './entities/community.entity';
import { UserService } from '../user/user.service';
export declare class CommunityService {
    private readonly userService;
    constructor(userService: UserService);
    communities: Community[];
    create(createCommunityDto: CreateCommunityDto): {
        communityId: number;
    };
    findAll(): {
        communityId: number;
        name: string;
        members: {
            userId: number;
            name: string;
            lastName: string;
        }[];
    }[];
    findOne(id: number): {
        communityId: number;
        name: string;
        members: {
            userId: number;
            name: string;
            lastName: string;
        }[];
    };
    remove(id: number): {
        message: string;
    };
    addMember(id: number, userId: number): {
        message: string;
    };
    removeMember(id: number, userId: number): {
        message: string;
    };
    private findEntity;
    private toView;
    private generateId;
}
