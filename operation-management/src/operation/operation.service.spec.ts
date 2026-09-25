import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { OperationService } from './operation.service';
import { OperationType } from './entities/operation.entity';
import { CopyService } from '../copy/copy.service';
import { CommunityService } from '../community/community.service';

const OWNER = 1;
const BORROWER = 2;
const THIRD = 3;
const OUTSIDER = 4;
const COMMUNITY = 10;
const OTHER_COMMUNITY = 20;

describe('OperationService', () => {
  let service: OperationService;
  let copyService: CopyService;
  let communityService: CommunityService;
  let copyId: number;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OperationService, CopyService, CommunityService],
    }).compile();

    service = module.get<OperationService>(OperationService);
    copyService = module.get<CopyService>(CopyService);
    communityService = module.get<CommunityService>(CommunityService);

    for (const userId of [OWNER, BORROWER, THIRD]) {
      communityService.setMembership(COMMUNITY, userId, { active: true });
    }
    copyId = copyService.create({ ownerUserId: OWNER }).copyId;
  });

  const loan = (fromUserId: number, toUserId: number, community = COMMUNITY) =>
    service.loan({ copyId, fromUserId, toUserId, communityId: community });
  const giveBack = (fromUserId: number, community = COMMUNITY) =>
    service.return({ copyId, fromUserId, communityId: community });
  const transfer = (fromUserId: number, toUserId: number) =>
    service.transferOwnership({
      copyId,
      fromUserId,
      toUserId,
      communityId: COMMUNITY,
    });

  describe('loan', () => {
    it('registers a LOAN and moves the copy to the borrower', () => {
      const { operationId } = loan(OWNER, BORROWER);

      expect(typeof operationId).toBe('number');
      expect(service.findOne(operationId)).toMatchObject({
        type: OperationType.LOAN,
        copyId,
        fromUserId: OWNER,
        toUserId: BORROWER,
        communityId: COMMUNITY,
      });
      expect(service.findOne(operationId).date).toBeInstanceOf(Date);
      expect(copyService.findOne(copyId)).toMatchObject({
        ownerUserId: OWNER,
        holderUserId: BORROWER,
      });
    });

    it('lets the current holder lend the copy again', () => {
      loan(OWNER, BORROWER);
      loan(BORROWER, THIRD);

      expect(copyService.findOne(copyId).holderUserId).toBe(THIRD);
      expect(copyService.findOne(copyId).ownerUserId).toBe(OWNER);
    });

    it('fails when the copy does not exist', () => {
      expect(() =>
        service.loan({
          copyId: 999,
          fromUserId: OWNER,
          toUserId: BORROWER,
          communityId: COMMUNITY,
        }),
      ).toThrow(NotFoundException);
    });

    it('fails when the copy was decommissioned', () => {
      service.decommission({ copyId, userId: OWNER });
      expect(() => loan(OWNER, BORROWER)).toThrow(ConflictException);
    });

    it('fails when someone who does not have the copy lends it', () => {
      expect(() => loan(BORROWER, THIRD)).toThrow(ForbiddenException);
    });

    it('fails when the owner lends a copy they do not have', () => {
      loan(OWNER, BORROWER);
      expect(() => loan(OWNER, THIRD)).toThrow(ForbiddenException);
    });

    it('fails when both users are the same', () => {
      expect(() => loan(OWNER, OWNER)).toThrow(BadRequestException);
    });

    it('fails when the borrower is not a member of the community', () => {
      expect(() => loan(OWNER, OUTSIDER)).toThrow(ForbiddenException);
    });

    it('fails when the borrower is an inactive member', () => {
      communityService.setMembership(COMMUNITY, BORROWER, { active: false });
      expect(() => loan(OWNER, BORROWER)).toThrow(ForbiddenException);
    });

    it('fails when the users share no active community', () => {
      communityService.setMembership(OTHER_COMMUNITY, OUTSIDER, {
        active: true,
      });
      expect(() => loan(OWNER, OUTSIDER, OTHER_COMMUNITY)).toThrow(
        ForbiddenException,
      );
    });

    it('does not change anything when it fails', () => {
      expect(() => loan(OWNER, OUTSIDER)).toThrow();
      expect(service.findAll()).toHaveLength(0);
      expect(copyService.findOne(copyId).holderUserId).toBe(OWNER);
    });

    it.each([
      [{}, 'missing fields'],
      [
        { copyId: '1', fromUserId: 1, toUserId: 2, communityId: 10 },
        'string id',
      ],
      [
        { copyId: 1.5, fromUserId: 1, toUserId: 2, communityId: 10 },
        'decimal id',
      ],
      [
        { copyId: -1, fromUserId: 1, toUserId: 2, communityId: 10 },
        'negative id',
      ],
      [
        { copyId: 1, fromUserId: 1, toUserId: 2, communityId: 10, extra: 1 },
        'unknown field',
      ],
    ])('rejects an invalid body (%#: %s)', (body) => {
      expect(() => service.loan(body as never)).toThrow(BadRequestException);
    });
  });

  describe('return', () => {
    it('registers a RETURN and gives the copy back to the owner', () => {
      loan(OWNER, BORROWER);
      const { operationId } = giveBack(BORROWER);

      expect(service.findOne(operationId)).toMatchObject({
        type: OperationType.RETURN,
        fromUserId: BORROWER,
        toUserId: OWNER,
      });
      expect(copyService.findOne(copyId).holderUserId).toBe(OWNER);
    });

    it('returns to the current owner after an ownership transfer', () => {
      loan(OWNER, BORROWER);
      transfer(OWNER, THIRD);
      giveBack(BORROWER);

      expect(copyService.findOne(copyId).holderUserId).toBe(THIRD);
    });

    it('returns straight to the owner from a second borrower', () => {
      loan(OWNER, BORROWER);
      loan(BORROWER, THIRD);
      giveBack(THIRD);

      expect(copyService.findOne(copyId).holderUserId).toBe(OWNER);
    });

    it('fails when the user returning does not have the copy', () => {
      loan(OWNER, BORROWER);
      expect(() => giveBack(THIRD)).toThrow(ForbiddenException);
    });

    it('fails when the copy is already with its owner', () => {
      expect(() => giveBack(OWNER)).toThrow(ConflictException);
    });

    it('fails when the copy was decommissioned', () => {
      loan(OWNER, BORROWER);
      service.decommission({ copyId, userId: OWNER });
      expect(() => giveBack(BORROWER)).toThrow(ConflictException);
    });

    it('fails when the holder and the owner cannot operate together', () => {
      loan(OWNER, BORROWER);
      communityService.setMembership(COMMUNITY, OWNER, { active: false });
      expect(() => giveBack(BORROWER)).toThrow(ForbiddenException);
      expect(copyService.findOne(copyId).holderUserId).toBe(BORROWER);
    });

    it('fails when the copy does not exist', () => {
      expect(() =>
        service.return({ copyId: 999, fromUserId: 1, communityId: 10 }),
      ).toThrow(NotFoundException);
    });
  });

  describe('transferOwnership', () => {
    it('registers an OWNERSHIP_TRANSFER and changes only the owner', () => {
      const { operationId } = transfer(OWNER, BORROWER);

      expect(service.findOne(operationId).type).toBe(
        OperationType.OWNERSHIP_TRANSFER,
      );
      expect(copyService.findOne(copyId)).toMatchObject({
        ownerUserId: BORROWER,
        holderUserId: OWNER,
      });
    });

    it('does not require the owner to have the copy', () => {
      loan(OWNER, BORROWER);
      transfer(OWNER, THIRD);

      expect(copyService.findOne(copyId)).toMatchObject({
        ownerUserId: THIRD,
        holderUserId: BORROWER,
      });
    });

    it('lets the new owner transfer it again', () => {
      transfer(OWNER, BORROWER);
      transfer(BORROWER, THIRD);
      expect(copyService.findOne(copyId).ownerUserId).toBe(THIRD);
    });

    it('fails when the user is not the current owner', () => {
      loan(OWNER, BORROWER);
      expect(() => transfer(BORROWER, THIRD)).toThrow(ForbiddenException);
    });

    it('fails for the previous owner', () => {
      transfer(OWNER, BORROWER);
      expect(() => transfer(OWNER, THIRD)).toThrow(ForbiddenException);
    });

    it('fails when both users are the same', () => {
      expect(() => transfer(OWNER, OWNER)).toThrow(BadRequestException);
    });

    it('fails when the users are not in the same active community', () => {
      expect(() => transfer(OWNER, OUTSIDER)).toThrow(ForbiddenException);
    });

    it('fails when the copy was decommissioned', () => {
      service.decommission({ copyId, userId: OWNER });
      expect(() => transfer(OWNER, BORROWER)).toThrow(ConflictException);
    });
  });

  describe('decommission', () => {
    it('registers a DECOMMISSION and deactivates the copy', () => {
      const { operationId } = service.decommission({ copyId, userId: OWNER });

      const operation = service.findOne(operationId);
      expect(operation).toMatchObject({
        type: OperationType.DECOMMISSION,
        fromUserId: OWNER,
      });
      expect(operation.toUserId).toBeUndefined();
      expect(copyService.findOne(copyId).active).toBe(false);
    });

    it('lets the owner decommission a copy that is on loan', () => {
      loan(OWNER, BORROWER);
      service.decommission({ copyId, userId: OWNER });
      expect(copyService.findOne(copyId).active).toBe(false);
    });

    it('fails when the user is not the owner', () => {
      loan(OWNER, BORROWER);
      expect(() => service.decommission({ copyId, userId: BORROWER })).toThrow(
        ForbiddenException,
      );
    });

    it('fails when the copy was already decommissioned', () => {
      service.decommission({ copyId, userId: OWNER });
      expect(() => service.decommission({ copyId, userId: OWNER })).toThrow(
        ConflictException,
      );
    });

    it('fails when the copy does not exist', () => {
      expect(() =>
        service.decommission({ copyId: 999, userId: OWNER }),
      ).toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('fails when the operation does not exist', () => {
      expect(() => service.findOne(999)).toThrow(NotFoundException);
    });
  });

  describe('hasOpenOperations', () => {
    it('is false when nothing is on loan', () => {
      expect(service.hasOpenOperations(OWNER)).toBe(false);
    });

    it('is true for the owner and the holder while a loan is open', () => {
      loan(OWNER, BORROWER);

      expect(service.hasOpenOperations(OWNER)).toBe(true);
      expect(service.hasOpenOperations(BORROWER)).toBe(true);
      expect(service.hasOpenOperations(THIRD)).toBe(false);
    });

    it('filters by the community of the loan', () => {
      loan(OWNER, BORROWER);

      expect(service.hasOpenOperations(BORROWER, COMMUNITY)).toBe(true);
      expect(service.hasOpenOperations(BORROWER, OTHER_COMMUNITY)).toBe(false);
    });

    it('is false once the copy is returned', () => {
      loan(OWNER, BORROWER);
      giveBack(BORROWER);

      expect(service.hasOpenOperations(OWNER)).toBe(false);
      expect(service.hasOpenOperations(BORROWER)).toBe(false);
    });

    it('is false once the copy is decommissioned', () => {
      loan(OWNER, BORROWER);
      service.decommission({ copyId, userId: OWNER });

      expect(service.hasOpenOperations(BORROWER)).toBe(false);
    });

    it('is false when the holder became the owner', () => {
      loan(OWNER, BORROWER);
      transfer(OWNER, BORROWER);

      expect(service.hasOpenOperations(OWNER)).toBe(false);
      expect(service.hasOpenOperations(BORROWER)).toBe(false);
    });
  });
});
