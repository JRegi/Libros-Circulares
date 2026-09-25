import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCopyDto } from './dto/create-copy.dto';
import { Copy } from './entities/copy.entity';
import { EditionService } from '../edition/edition.service';
import { UserClient } from './clients/user.client';
import {
  generateId,
  rejectUnknownFields,
  requireBody,
  validateId,
} from '../common/validation';

const COPY_FIELDS = ['editionId', 'ownerUserId'];

@Injectable()
export class CopyService {
  constructor(
    private readonly editionService: EditionService,
    private readonly userClient: UserClient,
  ) {}

  copies: Copy[] = [];

  async create(createCopyDto: CreateCopyDto) {
    const body = requireBody(createCopyDto);
    rejectUnknownFields(body, COPY_FIELDS);

    const editionId = validateId(body.editionId, 'editionId');
    const ownerUserId = validateId(body.ownerUserId, 'ownerUserId');
    // both throw NotFoundException if the edition / user does not exist
    this.editionService.findOne(editionId);
    await this.userClient.ensureUserExists(ownerUserId);

    const newCopy = new Copy();
    newCopy.copyId = generateId((id) => this.copies.some((c) => c.copyId == id));
    newCopy.editionId = editionId;
    // the owner is also the initial holder
    newCopy.ownerUserId = ownerUserId;
    newCopy.holderUserId = ownerUserId;
    this.copies.push(newCopy);

    return { copyId: newCopy.copyId };
  }

  findAll() {
    return this.copies;
  }

  getCopy(copyId: number): Copy {
    const copy = this.copies.find((c) => c.copyId == copyId);

    if (!copy) {
      throw new NotFoundException(`Copy ${copyId} not found`);
    }

    return copy;
  }

  // Used by Service II (ownership transfers).
  async changeOwner(copyId: number, newOwnerUserId: number): Promise<void> {
    const copy = this.getCopy(copyId);
    const userId = validateId(newOwnerUserId, 'newOwnerUserId');
    await this.userClient.ensureUserExists(userId);
    copy.ownerUserId = userId;
  }

  // Used by Service II (loans and returns).
  async changeHolder(copyId: number, newHolderUserId: number): Promise<void> {
    const copy = this.getCopy(copyId);
    const userId = validateId(newHolderUserId, 'newHolderUserId');
    await this.userClient.ensureUserExists(userId);
    copy.holderUserId = userId;
  }
}
