import { BadRequestException, Injectable } from '@nestjs/common';
import { SetMembershipDto } from './dto/set-membership.dto';
import { CommunityMembership } from './entities/community-membership.entity';
import { ensureKnownFields } from '../common/validation';

// In-memory stand-in for the community memberships managed by
// user-management. Only answers whether users can operate together.
@Injectable()
export class CommunityService {
  memberships: CommunityMembership[] = [];

  setMembership(
    communityId: number,
    userId: number,
    setMembershipDto: SetMembershipDto,
  ) {
    ensureKnownFields(setMembershipDto, ['active']);
    if (typeof setMembershipDto.active !== 'boolean') {
      throw new BadRequestException('active must be a boolean');
    }

    let membership = this.memberships.find(
      (m) => m.communityId == communityId && m.userId == userId,
    );
    if (!membership) {
      membership = new CommunityMembership();
      membership.communityId = communityId;
      membership.userId = userId;
      this.memberships.push(membership);
    }
    membership.active = setMembershipDto.active;

    return { ...membership };
  }

  findMembers(communityId: number) {
    return this.memberships
      .filter((m) => m.communityId == communityId)
      .map((m) => ({ ...m }));
  }

  isActiveMember(userId: number, communityId: number) {
    return this.memberships.some(
      (m) => m.communityId == communityId && m.userId == userId && m.active,
    );
  }

  canOperateTogether(userId1: number, userId2: number, communityId: number) {
    return (
      this.isActiveMember(userId1, communityId) &&
      this.isActiveMember(userId2, communityId)
    );
  }
}
