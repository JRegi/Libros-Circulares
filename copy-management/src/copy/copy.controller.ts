import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { CopyService } from './copy.service';
import { CreateCopyDto } from './dto/create-copy.dto';
import { ChangeOwnerDto } from './dto/change-owner.dto';
import { ChangeHolderDto } from './dto/change-holder.dto';
import { rejectUnknownFields, requireBody } from '../common/validation';

@Controller('copy')
export class CopyController {
  constructor(private readonly copyService: CopyService) {}

  @Post()
  create(@Body() createCopyDto: CreateCopyDto) {
    return this.copyService.create(createCopyDto);
  }

  @Get()
  findAll() {
    return this.copyService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.copyService.getCopy(id);
  }

  @Patch(':id/owner')
  changeOwner(
    @Param('id', ParseIntPipe) id: number,
    @Body() changeOwnerDto: ChangeOwnerDto,
  ) {
    const body = requireBody(changeOwnerDto);
    rejectUnknownFields(body, ['newOwnerUserId']);
    return this.copyService.changeOwner(id, changeOwnerDto.newOwnerUserId);
  }

  @Patch(':id/holder')
  changeHolder(
    @Param('id', ParseIntPipe) id: number,
    @Body() changeHolderDto: ChangeHolderDto,
  ) {
    const body = requireBody(changeHolderDto);
    rejectUnknownFields(body, ['newHolderUserId']);
    return this.copyService.changeHolder(id, changeHolderDto.newHolderUserId);
  }
}
