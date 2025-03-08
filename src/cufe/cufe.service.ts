import { Injectable } from '@nestjs/common';
import { CreateCufeDto } from './dto/create-cufe.dto';
import { UpdateCufeDto } from './dto/update-cufe.dto';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto'
import * as QRCode from 'qrcode';

@Injectable()
export class CufeService {
  constructor(private configService: ConfigService) { }

  /**
   * Genera CUFE (Código Único de Facturación Electrónica)
   * según algoritmo DIAN
   */
  generateCufe(invoiceData: any): string {
    // Construir cadena según especificaciones DIAN
    const softwareId = this.configService.get<string>('dian.softwareId');
    const softwarePin = this.configService.get<string>('dian.softwarePin');

    // Formato: NumFac + FecFac + HoraFac + ValFac + CodImp1 + ValImp1 + ... + NitOFE + NumAdq + ClTec + SoftwarePin
    const stringToHash =
      invoiceData.numero +
      invoiceData.fechaEmision.replace(/-/g, '') +
      invoiceData.horaEmision.replace(/:/g, '') +
      this.formatAmount(invoiceData.total) +
      '01' + // Código IVA
      this.formatAmount(invoiceData.totalIva) +
      invoiceData.emisor.numeroDocumento +
      invoiceData.receptor.numeroDocumento +
      softwareId +
      softwarePin;

    // Calcular CUFE usando SHA-384
    const cufe = crypto.createHash('sha384')
      .update(stringToHash)
      .digest('hex');

    return cufe;
  }

  /**
   * Genera código QR para la factura electrónica
   */
  async generateQR(invoiceData: any, cufe: string): Promise<string> {
    // Construir URL según especificaciones DIAN
    const qrData =
      `NumFac:${invoiceData.numero}\n` +
      `FecFac:${invoiceData.fechaEmision}\n` +
      `HorFac:${invoiceData.horaEmision}\n` +
      `NitFac:${invoiceData.emisor.numeroDocumento}\n` +
      `DocAdq:${invoiceData.receptor.numeroDocumento}\n` +
      `ValFac:${invoiceData.subtotal}\n` +
      `ValIva:${invoiceData.totalIva}\n` +
      `ValOtroIm:${invoiceData.totalOtrosImpuestos || 0}\n` +
      `ValTotal:${invoiceData.total}\n` +
      `CUFE:${cufe}\n` +
      `URL:https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=${cufe}`;

    // Generar imagen QR en base64
    const qrImage = await QRCode.toDataURL(qrData);

    return qrImage.split(',')[1]; // Devuelve solo la parte de datos base64
  }

  /**
   * Formatea montos según requerimientos DIAN
   */
  private formatAmount(amount: number): string {
    // Formato con 2 decimales, sin puntos, usando punto como separador decimal
    return amount.toFixed(2).replace(/\./g, '');
  }
}
