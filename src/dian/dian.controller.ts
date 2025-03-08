import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DianService } from './dian.service';
import { CreateDianDto } from './dto/create-dian.dto';
import { UpdateDianDto } from './dto/update-dian.dto';

@Controller('dian')
export class DianController {
  constructor(private readonly dianService: DianService) {}

  @Post()
  create(@Body() createDianDto: CreateDianDto) {
    return this.dianService.create(createDianDto);
  }

  @Get()
  findAll() {
    return this.dianService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dianService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDianDto: UpdateDianDto) {
    return this.dianService.update(+id, updateDianDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dianService.remove(+id);
  }
}
