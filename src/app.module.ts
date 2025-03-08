import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { XmlModule } from './xml/xml.module';
import { SignatureModule } from './signature/signature.module';
import { CufeModule } from './cufe/cufe.module';
import { InvoicesModule } from './invoices/invoices.module';
import { DianModule } from './dian/dian.module';
import { DianAuthModule } from './dian-auth/dian-auth.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    XmlModule,
    SignatureModule,
    CufeModule,
    InvoicesModule,
    DianModule,
    DianAuthModule,
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
