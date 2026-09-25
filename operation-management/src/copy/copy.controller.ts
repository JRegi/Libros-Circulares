import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { CopyService } from './copy.service';
import { CreateCopyDto } from './dto/create-copy.dto';

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
    return this.copyService.findOne(id);
  }
}
