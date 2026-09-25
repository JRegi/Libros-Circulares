import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCommunityDto } from './dto/create-community.dto';
import { Community } from './entities/community.entity';
import { UserService } from '../user/user.service';

const MAX_COMMUNITIES_PER_USER = 3;

@Injectable()
export class CommunityService {
  constructor(private readonly userService: UserService) {}

  communities: Community[] = [];

  create(createCommunityDto: CreateCommunityDto) {
    const name = createCommunityDto?.name;
    if (typeof name !== 'string' || name.trim() === '') {
      throw new BadRequestException('name must be a non-empty string');
    }
    const unknown = Object.keys(createCommunityDto).filter((k) => k != 'name');
    if (unknown.length > 0) {
      throw new BadRequestException(`Unknown fields: ${unknown.join(', ')}`);
    }

    const newCommunity = new Community();
    newCommunity.communityId = this.generateId();
    newCommunity.name = name.trim();
    this.communities.push(newCommunity);

    return { communityId: newCommunity.communityId };
  }

  findAll() {
    return this.communities.map((c) => this.toView(c));
  }

  findOne(id: number) {
    return this.toView(this.findEntity(id));
  }

  remove(id: number) {
    const community = this.findEntity(id);

    for (const member of community.members) {
      member.communities = member.communities.filter(
        (c) => c.communityId != id,
      );
    }
    this.communities = this.communities.filter((c) => c.communityId != id);

    return { message: `Community ${id} deleted` };
  }

  addMember(id: number, userId: number) {
    const community = this.findEntity(id);
    const user = this.userService.findEntity(userId);

    if (community.members.some((m) => m.userId == userId)) {
      throw new ConflictException(
        `User ${userId} is already a member of community ${id}`,
      );
    }
    if (user.communities.length >= MAX_COMMUNITIES_PER_USER) {
      throw new ConflictException(
        `A user can be a member of at most ${MAX_COMMUNITIES_PER_USER} communities`,
      );
    }

    community.members.push(user);
    user.communities.push(community);

    return { message: `User ${userId} added to community ${id}` };
  }

  removeMember(id: number, userId: number) {
    const community = this.findEntity(id);
    const user = this.userService.findEntity(userId);

    if (!community.members.some((m) => m.userId == userId)) {
      throw new NotFoundException(
        `User ${userId} is not a member of community ${id}`,
      );
    }

    community.members = community.members.filter((m) => m.userId != userId);
    user.communities = user.communities.filter((c) => c.communityId != id);

    return { message: `User ${userId} removed from community ${id}` };
  }

  private findEntity(id: number) {
    const community = this.communities.find((c) => c.communityId == id);

    if (!community) {
      throw new NotFoundException(`Community ${id} not found`);
    }

    return community;
  }

  private toView(community: Community) {
    return {
      communityId: community.communityId,
      name: community.name,
      members: community.members.map((m) => ({
        userId: m.userId,
        name: m.name,
        lastName: m.lastName,
      })),
    };
  }

  private generateId() {
    let id: number;
    do {
      id = Math.floor(Math.random() * 1_000_000_000) + 1;
    } while (this.communities.some((c) => c.communityId == id));
    return id;
  }
}
