import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { XmlModule } from 'src/xml/xml.module';
import { SignatureModule } from 'src/signature/signature.module';
import { CufeModule } from 'src/cufe/cufe.module';
import { DianModule } from 'src/dian/dian.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ Invoice ]),
    XmlModule,
    SignatureModule,
    CufeModule,
    DianModule
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService],
})
export class InvoicesModule {}
