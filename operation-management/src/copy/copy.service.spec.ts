import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CopyService } from './copy.service';

describe('CopyService', () => {
  let service: CopyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CopyService],
    }).compile();

    service = module.get<CopyService>(CopyService);
  });

  it('creates an active copy held by its owner', () => {
    const { copyId } = service.create({ ownerUserId: 7 });

    expect(service.findOne(copyId)).toEqual({
      copyId,
      ownerUserId: 7,
      holderUserId: 7,
      active: true,
    });
    expect(service.findAll()).toHaveLength(1);
  });

  it('rejects an invalid owner', () => {
    expect(() => service.create({ ownerUserId: 0 })).toThrow(
      BadRequestException,
    );
    expect(() => service.create({} as never)).toThrow(BadRequestException);
  });

  it('updates holder, owner and active state', () => {
    const { copyId } = service.create({ ownerUserId: 7 });

    service.setHolder(copyId, 8);
    service.setOwner(copyId, 9);
    service.decommission(copyId);

    expect(service.findOne(copyId)).toMatchObject({
      ownerUserId: 9,
      holderUserId: 8,
      active: false,
    });
  });

  it('does not expose the stored entity', () => {
    const { copyId } = service.create({ ownerUserId: 7 });
    service.findOne(copyId).holderUserId = 99;
    expect(service.findOne(copyId).holderUserId).toBe(7);
  });

  it('fails for a copy that does not exist', () => {
    expect(() => service.findOne(1)).toThrow(NotFoundException);
    expect(() => service.setHolder(1, 1)).toThrow(NotFoundException);
  });
});
