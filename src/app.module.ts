import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { XmlModule } from './xml/xml.module';
import { SignatureModule } from './signature/signature.module';
import { QrModule } from './qr/qr.module';
import { CufeModule } from './cufe/cufe.module';

@Module({
  imports: [XmlModule, SignatureModule, QrModule, CufeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
