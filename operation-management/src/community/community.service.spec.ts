import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CommunityService } from './community.service';

describe('CommunityService', () => {
  let service: CommunityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommunityService],
    }).compile();

    service = module.get<CommunityService>(CommunityService);
  });

  it('lets two active members of the same community operate', () => {
    service.setMembership(1, 10, { active: true });
    service.setMembership(1, 20, { active: true });

    expect(service.canOperateTogether(10, 20, 1)).toBe(true);
  });

  it('does not let users of different communities operate', () => {
    service.setMembership(1, 10, { active: true });
    service.setMembership(2, 20, { active: true });

    expect(service.canOperateTogether(10, 20, 1)).toBe(false);
    expect(service.canOperateTogether(10, 20, 2)).toBe(false);
  });

  it('does not let an inactive member operate', () => {
    service.setMembership(1, 10, { active: true });
    service.setMembership(1, 20, { active: true });
    service.setMembership(1, 20, { active: false });

    expect(service.canOperateTogether(10, 20, 1)).toBe(false);
    expect(service.findMembers(1)).toHaveLength(2);
  });

  it('rejects a body without a boolean active', () => {
    expect(() => service.setMembership(1, 10, {} as never)).toThrow(
      BadRequestException,
    );
    expect(() =>
      service.setMembership(1, 10, { active: 'yes' } as never),
    ).toThrow(BadRequestException);
  });
});
