import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { EditionService } from './edition.service';
import { CreateEditionDto } from './dto/create-edition.dto';

@Controller('edition')
export class EditionController {
  constructor(private readonly editionService: EditionService) {}

  @Post()
  create(@Body() createEditionDto: CreateEditionDto) {
    return this.editionService.create(createEditionDto);
  }

  @Get()
  findAll() {
    return this.editionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.editionService.findOne(id);
  }
}
