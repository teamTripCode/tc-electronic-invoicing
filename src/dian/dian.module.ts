import { Module } from '@nestjs/common';
import { DianService } from './dian.service';
import { DianController } from './dian.controller';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  controllers: [DianController],
  providers: [DianService],
  imports: [
    CacheModule.register({
      ttl: 300, // 5 minutos
      max: 100, // máximo 100 items en caché
    })
  ]
})
export class DianModule {}
