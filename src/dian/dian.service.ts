import { HttpServer, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DianAuthService } from 'src/dian-auth/dian-auth.service';
import { Cache } from 'cache-manager';
import axios from 'axios';

@Injectable()
export class DianService {
  private readonly logger = new Logger(DianService.name);

  constructor(
    private configService: ConfigService,
    private dianAuth: DianAuthService,
    @Inject('CACHE_MANAGER') private cache: Cache
  ) { }

  /**
   * Envía una factura electrónica a la DIAN
   */
  async sendInvoice(signedXml: string, testSet: boolean = false): Promise<any> {
    try {
      const token = await this.dianAuth.getAuthToken();
      const dianApiUrl = this.configService.get<string>('DIAN_API_URL');
      const softwareID = this.configService.get<string>('DIAN_SOFTWARE_ID');

      const payload = {
        fileName: `invoice_${Date.now()}.xml`,
        fileData: Buffer.from(signedXml).toString('base64'),
        testSetId: testSet ? this.configService.get<string>('DIAN_TEST_SET_ID') : undefined,
        softwareID: softwareID,
      };

      const response = await axios.post(`${dianApiUrl}/invoice/send`, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Error al enviar factura a DIAN: ${error.message}`, error.stack);
      throw new Error(`Error en envío a DIAN: ${error.message}`);
    }
  }

  /**
   * Consulta el estado de una factura electrónica
   */
  async getInvoiceStatus(cufe: string): Promise<any> {
    try {
      // Intentar obtener del caché primero
      const cachedStatus = await this.cache.get(`invoice_status_${cufe}`);
      if (cachedStatus) {
        return cachedStatus;
      }

      const token = await this.dianAuth.getAuthToken();
      const dianApiUrl = this.configService.get<string>('DIAN_API_URL');

      const response = await axios.get(`${dianApiUrl}/invoice/status/${cufe}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // Guardar en caché por 5 minutos
      await this.cache.set(`invoice_status_${cufe}`, response.data, 300000);

      return response.data;
    } catch (error) {
      this.logger.error(`Error al consultar estado factura: ${error.message}`, error.stack);
      throw new Error(`Error en consulta de estado: ${error.message}`);
    }
  }

  /**
   * Descarga el documento procesado por la DIAN
   */
  async downloadProcessedInvoice(cufe: string): Promise<Buffer> {
    try {
      const token = await this.dianAuth.getAuthToken();
      const dianApiUrl = this.configService.get<string>('DIAN_API_URL');

      const response = await axios.get(`${dianApiUrl}/invoice/download/${cufe}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        responseType: 'arraybuffer',
      });

      return Buffer.from(response.data);
    } catch (error) {
      this.logger.error(`Error al descargar factura: ${error.message}`, error.stack);
      throw new Error(`Error en descarga de factura: ${error.message}`);
    }
  }
}
