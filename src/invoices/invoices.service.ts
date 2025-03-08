import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Invoice, InvoiceStatus } from './entities/invoice.entity';
import { Repository } from 'typeorm';
import { XmlService } from 'src/xml/xml.service';
import { SignatureService } from 'src/signature/signature.service';
import { CufeService } from 'src/cufe/cufe.service';
import { DianService } from 'src/dian/dian.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    @InjectRepository(Invoice)
    private invoiceRepo: Repository<Invoice>,
    private xml: XmlService,
    private signature: SignatureService,
    private qr: CufeService,
    private dian: DianService
  ) { }

  /**
   * Crea una factura electrónica y la envía a la DIAN
   */
  async createAndSendInvoice(createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    try {
      // 1. Crear la factura en la base de datos
      const invoice = this.invoiceRepo.create(createInvoiceDto);

      // 2. Generar el CUFE
      invoice.cufe = this.qr.generateCufe(invoice);

      // 3. Generar código QR
      invoice.qrCode = await this.qr.generateQR(invoice, invoice.cufe);

      // 4. Generar XML UBL 2.1
      invoice.documentXML = this.xml.generateInvoiceXml(invoice);

      // 5. Firmar el XML
      invoice.signedXML = this.signature.signXml(invoice.documentXML, invoice.id);

      // 6. Guardar la factura antes de enviar a DIAN
      await this.invoiceRepo.save(invoice);

      // 7. Enviar a la DIAN
      const dianResponse = await this.dian.sendInvoice(
        invoice.signedXML,
        invoice.isTest
      );

      // 8. Actualizar con la respuesta de la DIAN
      invoice.dianResponse = JSON.stringify(dianResponse);
      invoice.dianResponseDate = new Date();
      invoice.status = dianResponse.isValid
        ? InvoiceStatus.APPROVED
        : InvoiceStatus.REJECTED;

      // 9. Guardar la factura actualizada
      return this.invoiceRepo.save(invoice);
    } catch (error) {
      this.logger.error(`Error en creación y envío de factura: ${error.message}`, error.stack);
      throw new Error(`Error en procesamiento de factura: ${error.message}`);
    }
  }

  /**
   * Consulta el estado de una factura en la DIAN
   */
  async checkInvoiceStatus(invoiceId: string): Promise<any> {
    const invoice = await this.invoiceRepo.findOne({ where: { id: invoiceId } });
    if (!invoice || !invoice.cufe) {
      throw new Error('Factura no encontrada o CUFE no generado');
    }

    const status = await this.dian.getInvoiceStatus(invoice.cufe);

    // Actualizar el estado en la base de datos
    if (status.status === 'ACCEPTED') {
      invoice.status = InvoiceStatus.APPROVED;
    } else if (status.status === 'REJECTED') {
      invoice.status = InvoiceStatus.REJECTED;
    }

    invoice.dianResponse = JSON.stringify(status);
    invoice.dianResponseDate = new Date();
    await this.invoiceRepo.save(invoice);

    return status;
  }

  /**
   * Obtiene todas las facturas
   */
  findAll(): Promise<Invoice[]> {
    return this.invoiceRepo.find();
  }

  /**
   * Obtiene una factura por su ID
   */
  findOne(id: string): Promise<Invoice | null> {
    return this.invoiceRepo.findOne({ where: { id } });
  }

  /**
   * Descarga una factura procesada por la DIAN
   */
  async downloadInvoicePdf(invoiceId: string): Promise<Buffer> {
    const invoice = await this.invoiceRepo.findOne({ where: { id: invoiceId } });
    if (!invoice || !invoice.cufe) {
      throw new Error('Factura no encontrada o CUFE no generado');
    }

    return this.dian.downloadProcessedInvoice(invoice.cufe);
  }
}
