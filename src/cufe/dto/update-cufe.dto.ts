import { PartialType } from '@nestjs/mapped-types';
import { CreateCufeDto } from './create-cufe.dto';

export class UpdateCufeDto extends PartialType(CreateCufeDto) {}
