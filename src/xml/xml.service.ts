import { Injectable } from '@nestjs/common';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';

@Injectable()
export class XmlService {
  private readonly xmlBuilder: XMLBuilder;
  private readonly xmlParser: XMLParser;

  constructor() {
    this.xmlBuilder = new XMLBuilder({
      attributeNamePrefix: '@_',
      ignoreAttributes: false,
      format: true,
      suppressEmptyNode: true,
    });

    this.xmlParser = new XMLParser({
      attributeNamePrefix: '@_',
      ignoreAttributes: false
    })
  }

  /**
   * Genera documento XML para factura electrónica en formato UBL 2.1
   */
  public generateInvoiceXml(invoiceData: any): string {
    // Estructura básica del XML según UBL 2.1 y requisitos DIAN
    const xmlObj = {
      'Invoice': {
        '@_xmlns': 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
        '@_xmlns:cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
        '@_xmlns:cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
        '@_xmlns:ds': 'http://www.w3.org/2000/09/xmldsig#',
        '@_xmlns:ext': 'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2',
        '@_xmlns:sts': 'dian:gov:co:facturaelectronica:Structures-2-1',
        '@_xmlns:xades': 'http://uri.etsi.org/01903/v1.3.2#',
        '@_xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',

        // UBL Extensions para firma digital
        'ext:UBLExtensions': {
          'ext:UBLExtension': [
            {
              'ext:ExtensionContent': {
                'sts:DianExtensions': {
                  'sts:InvoiceControl': {
                    'sts:InvoiceAuthorization': invoiceData.resolucion.numero,
                    'sts:AuthorizationPeriod': {
                      'cbc:StartDate': invoiceData.resolucion.fechaInicio,
                      'cbc:EndDate': invoiceData.resolucion.fechaFin,
                    },
                    'sts:AuthorizedInvoices': {
                      'sts:Prefix': invoiceData.resolucion.prefijo,
                      'sts:From': invoiceData.resolucion.desde,
                      'sts:To': invoiceData.resolucion.hasta,
                    },
                  },
                  'sts:SoftwareProvider': {
                    'sts:ProviderID': invoiceData.proveedor.nit,
                    'sts:SoftwareID': invoiceData.proveedor.softwareId,
                  },
                  'sts:SoftwareSecurityCode': '', // Se llenará después
                },
              },
            },
            {
              'ext:ExtensionContent': {
                // Espacio reservado para la firma XAdES
                'ds:Signature': {
                  '@_Id': 'xmldsig-' + invoiceData.id,
                  // La firma se agregará después
                },
              },
            },
          ]
        },

        // Datos básicos de la factura
        'cbc:UBLVersionID': '2.1',
        'cbc:CustomizationID': 'DIAN 2.1',
        'cbc:ProfileID': 'DIAN 2.1: factura electrónica de venta',
        'cbc:ProfileExecutionID': invoiceData.ambiente, // 1=producción, 2=pruebas
        'cbc:ID': invoiceData.numero,
        'cbc:UUID': '', // Se llenará con el CUFE
        'cbc:IssueDate': invoiceData.fechaEmision,
        'cbc:IssueTime': invoiceData.horaEmision,
        'cbc:InvoiceTypeCode': '01', // 01=Factura de venta
        'cbc:DocumentCurrencyCode': invoiceData.moneda,

        // Información del emisor
        'cac:AccountingSupplierParty': this.buildSupplierParty(invoiceData.emisor),

        // Información del receptor
        'cac:AccountingCustomerParty': this.buildCustomerParty(invoiceData.receptor),

        // Información de impuestos
        'cac:TaxTotal': this.buildTaxTotals(invoiceData.impuestos),

        // Información monetaria
        'cac:LegalMonetaryTotal': {
          'cbc:LineExtensionAmount': {
            '@_currencyID': invoiceData.moneda,
            '#text': invoiceData.subtotal,
          },
          'cbc:TaxExclusiveAmount': {
            '@_currencyID': invoiceData.moneda,
            '#text': invoiceData.subtotal,
          },
          'cbc:TaxInclusiveAmount': {
            '@_currencyID': invoiceData.moneda,
            '#text': invoiceData.total,
          },
          'cbc:PayableAmount': {
            '@_currencyID': invoiceData.moneda,
            '#text': invoiceData.total,
          },
        },

        // Ítems de la factura
        'cac:InvoiceLine': this.buildInvoiceLines(invoiceData.items, invoiceData.moneda),
      },
    };

    return this.xmlBuilder.build(xmlObj);
  }

  /**
   * Construye sección de emisor
   */
  private buildSupplierParty(emisor: any): any {
    return {
      'cac:Party': {
        'cac:PartyIdentification': {
          'cbc:ID': {
            '@_schemeID': emisor.tipoDocumento,
            '#text': emisor.numeroDocumento,
          },
        },
        'cac:PartyName': {
          'cbc:Name': emisor.razonSocial,
        },
        'cac:PartyTaxScheme': {
          'cbc:RegistrationName': emisor.razonSocial,
          'cbc:CompanyID': {
            '@_schemeID': emisor.tipoDocumento,
            '@_schemeName': '31', // Lista de códigos DIAN
            '#text': emisor.numeroDocumento,
          },
          'cbc:TaxLevelCode': emisor.regimenFiscal,
          'cac:RegistrationAddress': {
            'cbc:ID': emisor.codigoMunicipio,
            'cbc:CityName': emisor.ciudad,
            'cbc:CountrySubentity': emisor.departamento,
            'cbc:CountrySubentityCode': emisor.codigoDepartamento,
            'cac:AddressLine': {
              'cbc:Line': emisor.direccion,
            },
            'cac:Country': {
              'cbc:IdentificationCode': emisor.codigoPais,
              'cbc:Name': {
                '@_languageID': 'es',
                '#text': emisor.pais,
              },
            },
          },
          'cac:TaxScheme': {
            'cbc:ID': '01', // 01=IVA
            'cbc:Name': 'IVA',
          },
        },
        'cac:PartyLegalEntity': {
          'cbc:RegistrationName': emisor.razonSocial,
          'cbc:CompanyID': {
            '@_schemeID': emisor.tipoDocumento,
            '#text': emisor.numeroDocumento,
          },
        },
        'cac:Contact': {
          'cbc:ElectronicMail': emisor.email,
          'cbc:Telephone': emisor.telefono,
        },
      },
    };
  }

  /**
   * Construye sección de receptor
   */
  private buildCustomerParty(receptor: any): any {
    return {
      'cac:Party': {
        'cac:PartyIdentification': {
          'cbc:ID': {
            '@_schemeID': receptor.tipoDocumento,
            '#text': receptor.numeroDocumento,
          },
        },
        'cac:PartyName': {
          'cbc:Name': receptor.razonSocial,
        },
        'cac:PartyTaxScheme': {
          'cbc:RegistrationName': receptor.razonSocial,
          'cbc:CompanyID': {
            '@_schemeID': receptor.tipoDocumento,
            '#text': receptor.numeroDocumento,
          },
          'cbc:TaxLevelCode': receptor.regimenFiscal,
          'cac:RegistrationAddress': {
            'cbc:ID': receptor.codigoMunicipio,
            'cbc:CityName': receptor.ciudad,
            'cbc:CountrySubentity': receptor.departamento,
            'cac:AddressLine': {
              'cbc:Line': receptor.direccion,
            },
            'cac:Country': {
              'cbc:IdentificationCode': receptor.codigoPais,
              'cbc:Name': {
                '@_languageID': 'es',
                '#text': receptor.pais,
              },
            },
          },
          'cac:TaxScheme': {
            'cbc:ID': '01', // 01=IVA
            'cbc:Name': 'IVA',
          },
        },
        'cac:PartyLegalEntity': {
          'cbc:RegistrationName': receptor.razonSocial,
          'cbc:CompanyID': {
            '@_schemeID': receptor.tipoDocumento,
            '#text': receptor.numeroDocumento,
          },
        },
        'cac:Contact': {
          'cbc:ElectronicMail': receptor.email,
          'cbc:Telephone': receptor.telefono,
        },
      },
    };
  }

  /**
   * Construye sección de impuestos
   */
  private buildTaxTotals(impuestos: any[]): any {
    return impuestos.map(impuesto => ({
      'cbc:TaxAmount': {
        '@_currencyID': impuesto.moneda,
        '#text': impuesto.valor,
      },
      'cbc:TaxableAmount': {
        '@_currencyID': impuesto.moneda,
        '#text': impuesto.baseImponible,
      },
      'cac:TaxSubtotal': {
        'cbc:TaxableAmount': {
          '@_currencyID': impuesto.moneda,
          '#text': impuesto.baseImponible,
        },
        'cbc:TaxAmount': {
          '@_currencyID': impuesto.moneda,
          '#text': impuesto.valor,
        },
        'cbc:Percent': impuesto.porcentaje,
        'cac:TaxCategory': {
          'cbc:Percent': impuesto.porcentaje,
          'cac:TaxScheme': {
            'cbc:ID': impuesto.codigo,
            'cbc:Name': impuesto.nombre,
          },
        },
      },
    }));
  }

  /**
   * Construye sección de líneas de factura
   */
  private buildInvoiceLines(items: any[], moneda: string): any {
    return items.map((item, index) => ({
      'cbc:ID': index + 1,
      'cbc:InvoicedQuantity': {
        '@_unitCode': item.unidadMedida,
        '#text': item.cantidad,
      },
      'cbc:LineExtensionAmount': {
        '@_currencyID': moneda,
        '#text': item.subtotal,
      },
      'cac:TaxTotal': {
        'cbc:TaxAmount': {
          '@_currencyID': moneda,
          '#text': item.impuestos.reduce((sum, tax) => sum + tax.valor, 0),
        },
        'cac:TaxSubtotal': item.impuestos.map(impuesto => ({
          'cbc:TaxableAmount': {
            '@_currencyID': moneda,
            '#text': impuesto.baseImponible,
          },
          'cbc:TaxAmount': {
            '@_currencyID': moneda,
            '#text': impuesto.valor,
          },
          'cbc:Percent': impuesto.porcentaje,
          'cac:TaxCategory': {
            'cbc:Percent': impuesto.porcentaje,
            'cac:TaxScheme': {
              'cbc:ID': impuesto.codigo,
              'cbc:Name': impuesto.nombre,
            },
          },
        })),
      },
      'cac:Item': {
        'cbc:Description': item.descripcion,
        'cac:StandardItemIdentification': {
          'cbc:ID': {
            '@_schemeID': 'UNSPSC',
            '#text': item.codigoProducto,
          },
        },
      },
      'cac:Price': {
        'cbc:PriceAmount': {
          '@_currencyID': moneda,
          '#text': item.precioUnitario,
        },
      },
    }));
  }

  /**
   * Valida un documento XML contra su esquema XSD
   */
  validateXmlAgainstSchema(xml: string, schemaPath: string): boolean {
    // Implementar validación con bibliotecas como libxmljs
    // Esta es una función avanzada que requiere manejo de esquemas XSD
    return true; // Simulado para este ejemplo
  }

}
