"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunityService = void 0;
const common_1 = require("@nestjs/common");
const community_membership_entity_1 = require("./entities/community-membership.entity");
const validation_1 = require("../common/validation");
let CommunityService = class CommunityService {
    memberships = [];
    setMembership(communityId, userId, setMembershipDto) {
        (0, validation_1.ensureKnownFields)(setMembershipDto, ['active']);
        if (typeof setMembershipDto.active !== 'boolean') {
            throw new common_1.BadRequestException('active must be a boolean');
        }
        let membership = this.memberships.find((m) => m.communityId == communityId && m.userId == userId);
        if (!membership) {
            membership = new community_membership_entity_1.CommunityMembership();
            membership.communityId = communityId;
            membership.userId = userId;
            this.memberships.push(membership);
        }
        membership.active = setMembershipDto.active;
        return { ...membership };
    }
    findMembers(communityId) {
        return this.memberships
            .filter((m) => m.communityId == communityId)
            .map((m) => ({ ...m }));
    }
    isActiveMember(userId, communityId) {
        return this.memberships.some((m) => m.communityId == communityId && m.userId == userId && m.active);
    }
    canOperateTogether(userId1, userId2, communityId) {
        return (this.isActiveMember(userId1, communityId) &&
            this.isActiveMember(userId2, communityId));
    }
};
exports.CommunityService = CommunityService;
exports.CommunityService = CommunityService = __decorate([
    (0, common_1.Injectable)()
], CommunityService);
//# sourceMappingURL=community.service.js.map