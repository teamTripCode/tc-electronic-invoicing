import { PartialType } from '@nestjs/mapped-types';
import { CreateDianAuthDto } from './create-dian-auth.dto';

export class UpdateDianAuthDto extends PartialType(CreateDianAuthDto) {}
