import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCopyDto } from './dto/create-copy.dto';
import { Copy } from './entities/copy.entity';
import { generateId, readPositiveIntegers } from '../common/validation';

// In-memory stand-in for the copy data of Servicio I (copy-management).
@Injectable()
export class CopyService {
  copies: Copy[] = [];

  create(createCopyDto: CreateCopyDto) {
    const { ownerUserId } = readPositiveIntegers(createCopyDto, [
      'ownerUserId',
    ]);

    // A new copy starts in its owner's possession.
    const copy = new Copy();
    copy.copyId = generateId((id) => this.copies.some((c) => c.copyId == id));
    copy.ownerUserId = ownerUserId;
    copy.holderUserId = ownerUserId;
    copy.active = true;
    this.copies.push(copy);

    return { copyId: copy.copyId };
  }

  findAll() {
    return this.copies.map((c) => ({ ...c }));
  }

  findOne(copyId: number) {
    return { ...this.findEntity(copyId) };
  }

  setHolder(copyId: number, userId: number) {
    this.findEntity(copyId).holderUserId = userId;
  }

  setOwner(copyId: number, userId: number) {
    this.findEntity(copyId).ownerUserId = userId;
  }

  decommission(copyId: number) {
    this.findEntity(copyId).active = false;
  }

  private findEntity(copyId: number) {
    const copy = this.copies.find((c) => c.copyId == copyId);

    if (!copy) {
      throw new NotFoundException(`Copy ${copyId} not found`);
    }

    return copy;
  }
}
