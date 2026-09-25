import { CommunityService } from './community.service';
import { SetMembershipDto } from './dto/set-membership.dto';
export declare class CommunityController {
    private readonly communityService;
    constructor(communityService: CommunityService);
    setMembership(communityId: number, userId: number, setMembershipDto: SetMembershipDto): {
        userId: number;
        communityId: number;
        active: boolean;
    };
    findMembers(communityId: number): {
        userId: number;
        communityId: number;
        active: boolean;
    }[];
}
