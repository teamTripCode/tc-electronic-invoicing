import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DianAuthService } from './dian-auth.service';
import { CreateDianAuthDto } from './dto/create-dian-auth.dto';
import { UpdateDianAuthDto } from './dto/update-dian-auth.dto';

@Controller('dian-auth')
export class DianAuthController {
  constructor(private readonly dianAuthService: DianAuthService) {}

  @Post()
  create(@Body() createDianAuthDto: CreateDianAuthDto) {
    return this.dianAuthService.create(createDianAuthDto);
  }

  @Get()
  findAll() {
    return this.dianAuthService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dianAuthService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDianAuthDto: UpdateDianAuthDto) {
    return this.dianAuthService.update(+id, updateDianAuthDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dianAuthService.remove(+id);
  }
}
