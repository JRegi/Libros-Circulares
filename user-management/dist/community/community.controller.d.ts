import { CommunityService } from './community.service';
import { CreateCommunityDto } from './dto/create-community.dto';
export declare class CommunityController {
    private readonly communityService;
    constructor(communityService: CommunityService);
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
}
