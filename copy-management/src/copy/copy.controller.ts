import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CopyService } from './copy.service';
import { CreateCopyDto } from './dto/create-copy.dto';
import { UpdateCopyDto } from './dto/update-copy.dto';

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
  findOne(@Param('id') id: string) {
    return this.copyService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCopyDto: UpdateCopyDto) {
    return this.copyService.update(+id, updateCopyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.copyService.remove(+id);
  }
}
