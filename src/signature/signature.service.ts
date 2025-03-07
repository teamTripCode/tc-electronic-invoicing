import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as forge from 'node-forge';

@Injectable()
export class SignatureService {
  private logger = new Logger(SignatureService.name);
  private certificate: any;
  private privateKey: any;

  constructor(private configService: ConfigService) {
    this.loadCertificate();
  }

  /**
   * Carga el certificado digital desde el archivo P12
   */
  private loadCertificate(): void {
    try {
      const certificatePath = this.configService.get<string>('dian.certificatePath');
      const certificatePassword = this.configService.get<string>('dian.certificatePassword');

      if (!certificatePath) throw new Error('Certificate path is not defined');

      const p12Buffer = fs.readFileSync(certificatePath);
      const p12Der = forge.util.createBuffer(p12Buffer);
      const p12Asn1 = forge.asn1.fromDer(p12Der);

      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, certificatePassword);

      // Extraer certificado y llave privada
      const bags = p12.getBags({ bagType: forge.pki.oids.certBag });
      this.certificate = bags[forge.pki.oids.certBag][0].cert;

      const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
      this.privateKey = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag][0].key;

      this.logger.log('Certificado digital cargado correctamente');
    } catch (error) {
      this.logger.error('Error al cargar el certificado digital', error);
      throw new Error('No se pudo cargar el certificado digital');
    }
  }

  /**
   * Firma un documento XML según estándar XAdES-EPES requerido por DIAN
   * Nota: Esta es una implementación simplificada. Para una implementación completa
   * de XAdES-EPES se requiere una biblioteca especializada o implementación detallada
   * según especificaciones técnicas de DIAN.
   */
  signXml(xml: string, documentId: string): string {
    try {
      // 1. Preparar el documento para la firma
      // Nota: Esta es una implementación conceptual. En un entorno real
      // se debe usar una biblioteca específica para XAdES como xadesjs

      // 2. Calcular digest del documento
      const documentDigest = this.calculateDigest(xml);

      // 3. Firmar el digest con la llave privada
      const signature = forge.pki.privateKeyToPem(this.privateKey)
        .sign(documentDigest);

      // 4. Obtener información del certificado para incluir en la firma
      const certInfo = {
        serialNumber: this.certificate.serialNumber,
        issuer: this.certificate.issuer.attributes.map(attr =>
          `${attr.shortName}=${attr.value}`).join(', '),
        subject: this.certificate.subject.attributes.map(attr =>
          `${attr.shortName}=${attr.value}`).join(', '),
        validFrom: this.certificate.validity.notBefore,
        validTo: this.certificate.validity.notAfter,
      };

      // 5. Incorporar la firma XAdES al documento
      // Esto es un placeholder - la implementación real requiere generar
      // la estructura XAdES completa según especificaciones DIAN
      const signedXml = this.incorporateXadesSignature(
        xml,
        signature,
        documentDigest,
        certInfo,
        documentId
      );

      return signedXml;
    } catch (error) {
      this.logger.error('Error al firmar el documento XML', error);
      throw new Error('No se pudo firmar el documento XML');
    }
  }

  /**
   * Calcula el digest SHA-256 de un documento
   */
  private calculateDigest(data: string): string {
    const md = forge.md.sha256.create();
    md.update(data);
    return md.digest().toHex();
  }

  /**
   * Incorpora la firma XAdES al documento XML
   * Nota: Esta es una implementación conceptual
   */
  private incorporateXadesSignature(
    xml: string,
    signature: string,
    digest: string,
    certInfo: any,
    documentId: string
  ): string {
    // En una implementación real, aquí se construiría el bloque XAdES
    // completo según especificaciones técnicas de DIAN

    // Este es un placeholder simplificado
    const signatureBlock = `
        <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Id="xmldsig-${documentId}">
          <ds:SignedInfo>
            <ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
            <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
            <ds:Reference URI="">
              <ds:Transforms>
                <ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
              </ds:Transforms>
              <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
              <ds:DigestValue>${digest}</ds:DigestValue>
            </ds:Reference>
          </ds:SignedInfo>
          <ds:SignatureValue>${signature}</ds:SignatureValue>
          <ds:KeyInfo>
            <ds:X509Data>
              <ds:X509Certificate>${forge.util.encode64(
      forge.asn1.toDer(
        forge.pki.certificateToAsn1(this.certificate)
      ).getBytes()
    )}</ds:X509Certificate>
              <ds:X509IssuerSerial>
                <ds:X509IssuerName>${certInfo.issuer}</ds:X509IssuerName>
                <ds:X509SerialNumber>${certInfo.serialNumber}</ds:X509SerialNumber>
              </ds:X509IssuerSerial>
            </ds:X509Data>
          </ds:KeyInfo>
          <ds:Object>
            <xades:QualifyingProperties xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" 
              Target="#xmldsig-${documentId}">
              <xades:SignedProperties Id="xmldsig-${documentId}-signedprops">
                <xades:SignedSignatureProperties>
                  <xades:SigningTime>${new Date().toISOString()}</xades:SigningTime>
                  <xades:SigningCertificate>
                    <xades:Cert>
                      <xades:CertDigest>
                        <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
                        <ds:DigestValue>${this.calculateDigest(
      forge.util.encode64(
        forge.asn1.toDer(
          forge.pki.certificateToAsn1(this.certificate)
        ).getBytes()
      )
    )}</ds:DigestValue>
                      </xades:CertDigest>
                      <xades:IssuerSerial>
                        <ds:X509IssuerName>${certInfo.issuer}</ds:X509IssuerName>
                        <ds:X509SerialNumber>${certInfo.serialNumber}</ds:X509SerialNumber>
                      </xades:IssuerSerial>
                    </xades:Cert>
                  </xades:SigningCertificate>
                </xades:SignedSignatureProperties>
                <xades:SignedDataObjectProperties>
                  <xades:DataObjectFormat ObjectReference="#xmldsig-${documentId}-ref0">
                    <xades:MimeType>text/xml</xades:MimeType>
                  </xades:DataObjectFormat>
                </xades:SignedDataObjectProperties>
              </xades:SignedProperties>
            </xades:QualifyingProperties>
          </ds:Object>
        </ds:Signature>
      `;

    // Inserta el bloque de firma en el lugar apropiado del XML
    // En un caso real, esto se haría con una biblioteca de manipulación XML
    return xml.replace(
      /<ds:Signature Id="xmldsig-[^>]*>[^<]*<\/ds:Signature>/,
      signatureBlock
    );
  }
}
