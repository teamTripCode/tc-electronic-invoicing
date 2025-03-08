import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'fs';
import * as forge from 'node-forge';
import axios from 'axios'

@Injectable()
export class DianAuthService {
  private logger = new Logger(DianAuthService.name);
  private token: string | null = null;
  private tokenExpiration: Date | null = null;

  constructor(private configService: ConfigService) { }

  /**
   * Obtiene un token de autenticación de la DIAN
   */
  async getAuthToken(): Promise<string | null> {
    // Verificar si el token actual sigue siendo válido
    if (this.token && this.tokenExpiration && this.tokenExpiration > new Date()) {
      if (this.token) {
        return this.token;
      }
      throw new Error('Failed to obtain DIAN token.');
    }

    try {
      const certificatePath = this.configService.get<string>('DIAN_CERTIFICATE_PATH');
      const certificatePassword = this.configService.get<string>('DIAN_CERTIFICATE_PASSWORD');
      const dianAuthUrl = this.configService.get<string>('DIAN_AUTH_URL');
      const softwareID = this.configService.get<string>('DIAN_SOFTWARE_ID');

      if (!certificatePath) {
        throw new Error('DIAN_CERTIFICATE_PATH is not defined');
      }

      const certificateData = readFileSync(certificatePath);
      const p12 = forge.pkcs12.pkcs12FromAsn1(
        forge.asn1.fromDer(forge.util.createBuffer(certificateData)),
        certificatePassword
      );

      // Extraer información del certificado
      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const certBag = certBags[forge.pki.oids.certBag];
      if (!certBag || certBag.length === 0) {
        throw new Error('No certificate found in the provided PKCS#12 file.');
      }
      const certificate = certBag[0]?.cert;

      if (!certificate) {
        throw new Error('Certificate is undefined.');
      }

      // Preparar datos para la petición
      const authData = {
        username: certificate.subject.getField('CN').value,
        password: certificatePassword,
        grant_type: 'password',
        scope: `${softwareID} ${certificate.serialNumber}`,
      };

      // Hacer petición a la API de DIAN
      if (!dianAuthUrl) {
        throw new Error('DIAN_AUTH_URL is not defined');
      }
      const response = await axios.post(dianAuthUrl, authData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      // Guardar el token y su expiración
      this.token = response.data.access_token;

      // Establecer expiración (restando 5 minutos por seguridad)
      this.tokenExpiration = new Date(Date.now() + (response.data.expires_in - 300) * 1000);

      return this.token;
    } catch (error) {
      this.logger.error(`Error al obtener token DIAN: ${error.message}`, error.stack);
      throw new Error(`Error de autenticación con DIAN: ${error.message}`);
    }
  }
}
