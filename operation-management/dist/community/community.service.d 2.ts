import { SetMembershipDto } from './dto/set-membership.dto';
import { CommunityMembership } from './entities/community-membership.entity';
export declare class CommunityService {
    memberships: CommunityMembership[];
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
    isActiveMember(userId: number, communityId: number): boolean;
    canOperateTogether(userId1: number, userId2: number, communityId: number): boolean;
}
