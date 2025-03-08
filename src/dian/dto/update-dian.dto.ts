import { PartialType } from '@nestjs/mapped-types';
import { CreateDianDto } from './create-dian.dto';

export class UpdateDianDto extends PartialType(CreateDianDto) {}
