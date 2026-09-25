import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { CommunityService } from './community.service';
import { SetMembershipDto } from './dto/set-membership.dto';

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Put(':communityId/members/:userId')
  setMembership(
    @Param('communityId', ParseIntPipe) communityId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() setMembershipDto: SetMembershipDto,
  ) {
    return this.communityService.setMembership(
      communityId,
      userId,
      setMembershipDto,
    );
  }

  @Get(':communityId/members')
  findMembers(@Param('communityId', ParseIntPipe) communityId: number) {
    return this.communityService.findMembers(communityId);
  }
}
