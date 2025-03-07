import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CufeService } from './cufe.service';
import { CreateCufeDto } from './dto/create-cufe.dto';
import { UpdateCufeDto } from './dto/update-cufe.dto';

@Controller('cufe')
export class CufeController {
  constructor(private readonly cufeService: CufeService) {}

  @Post()
  create(@Body() createCufeDto: CreateCufeDto) {
    return this.cufeService.create(createCufeDto);
  }

  @Get()
  findAll() {
    return this.cufeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cufeService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCufeDto: UpdateCufeDto) {
    return this.cufeService.update(+id, updateCufeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cufeService.remove(+id);
  }
}
