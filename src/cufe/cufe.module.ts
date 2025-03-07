import { Module } from '@nestjs/common';
import { CufeService } from './cufe.service';
import { CufeController } from './cufe.controller';

@Module({
  controllers: [CufeController],
  providers: [CufeService],
})
export class CufeModule {}
