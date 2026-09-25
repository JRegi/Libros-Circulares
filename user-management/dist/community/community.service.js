"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunityService = void 0;
const common_1 = require("@nestjs/common");
const community_entity_1 = require("./entities/community.entity");
const user_service_1 = require("../user/user.service");
const MAX_COMMUNITIES_PER_USER = 3;
let CommunityService = class CommunityService {
    userService;
    constructor(userService) {
        this.userService = userService;
    }
    communities = [];
    create(createCommunityDto) {
        const name = createCommunityDto?.name;
        if (typeof name !== 'string' || name.trim() === '') {
            throw new common_1.BadRequestException('name must be a non-empty string');
        }
        const newCommunity = new community_entity_1.Community();
        newCommunity.communityId = this.generateId();
        newCommunity.name = name.trim();
        this.communities.push(newCommunity);
        return { communityId: newCommunity.communityId };
    }
    findAll() {
        return this.communities.map((c) => this.toView(c));
    }
    findOne(id) {
        return this.toView(this.findEntity(id));
    }
    remove(id) {
        const community = this.findEntity(id);
        for (const member of community.members) {
            member.communities = member.communities.filter((c) => c.communityId != id);
        }
        this.communities = this.communities.filter((c) => c.communityId != id);
        return { message: `Community ${id} deleted` };
    }
    addMember(id, userId) {
        const community = this.findEntity(id);
        const user = this.userService.findEntity(userId);
        if (community.members.some((m) => m.userId == userId)) {
            throw new common_1.ConflictException(`User ${userId} is already a member of community ${id}`);
        }
        if (user.communities.length >= MAX_COMMUNITIES_PER_USER) {
            throw new common_1.ConflictException(`A user can be a member of at most ${MAX_COMMUNITIES_PER_USER} communities`);
        }
        community.members.push(user);
        user.communities.push(community);
        return { message: `User ${userId} added to community ${id}` };
    }
    removeMember(id, userId) {
        const community = this.findEntity(id);
        const user = this.userService.findEntity(userId);
        if (!community.members.some((m) => m.userId == userId)) {
            throw new common_1.NotFoundException(`User ${userId} is not a member of community ${id}`);
        }
        community.members = community.members.filter((m) => m.userId != userId);
        user.communities = user.communities.filter((c) => c.communityId != id);
        return { message: `User ${userId} removed from community ${id}` };
    }
    findEntity(id) {
        const community = this.communities.find((c) => c.communityId == id);
        if (!community) {
            throw new common_1.NotFoundException(`Community ${id} not found`);
        }
        return community;
    }
    toView(community) {
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
    generateId() {
        let id;
        do {
            id = Math.floor(Math.random() * 1_000_000_000) + 1;
        } while (this.communities.some((c) => c.communityId == id));
        return id;
    }
};
exports.CommunityService = CommunityService;
exports.CommunityService = CommunityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_service_1.UserService])
], CommunityService);
//# sourceMappingURL=community.service.js.map