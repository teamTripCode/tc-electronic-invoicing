import { Module } from '@nestjs/common';
import { DianAuthService } from './dian-auth.service';
import { DianAuthController } from './dian-auth.controller';

@Module({
  controllers: [DianAuthController],
  providers: [DianAuthService],
  exports: [DianAuthService]
})
export class DianAuthModule {}
