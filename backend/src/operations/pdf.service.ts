import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';

interface OperationData {
  operation: {
    id: number;
    operationNumber: string;
    operationType: string;
    status: string;
    origin: string;
    destination: string;
    scheduledStartDate: string;
    scheduledEndDate?: string;
    actualStartDate?: string;
    actualEndDate?: string;
    distance?: number;
    cargoDescription?: string;
    cargoWeight?: number;
    notes?: string;
  };
  client?: {
    businessName: string;
    contactName?: string;
    contactPhone?: string;
  };
  provider?: {
    businessName: string;
    contactName?: string;
    contactPhone?: string;
  };
  driver: {
    firstName: string;
    lastName: string;
    phone?: string;
    licenseType: string;
  };
  vehicle: {
    plateNumber: string;
    brand?: string;
    model?: string;
    vehicleType: string;
  };
  route?: {
    name: string;
    distance?: number;
  };
  operator: {
    businessName: string;
  };
}

interface ReportOptions {
  includePhotos?: boolean;
  includeTimeline?: boolean;
  includeIncidents?: boolean;
  language?: string;
}

@Injectable()
export class PdfService {
  async generateOperationReport(
    operationData: OperationData,
    options: ReportOptions = {},
  ): Promise<Buffer> {
    const {
      includePhotos = true,
      includeTimeline = true,
      includeIncidents = true,
      language = 'es',
    } = options;

    const html = this.generateHtmlTemplate(
      operationData,
      includePhotos,
      includeTimeline,
      includeIncidents,
      language,
    );

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  private generateHtmlTemplate(
    data: OperationData,
    includePhotos: boolean,
    includeTimeline: boolean,
    includeIncidents: boolean,
    language: string,
  ): string {
    const formattedDate = new Date().toLocaleDateString('es-CL');

    return `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Informe de Operación - ${data.operation.operationNumber}</title>
</head>
<body>
  <h1>INFORME DE OPERACIÓN</h1>
  <p><strong>N° Operación:</strong> ${data.operation.operationNumber}</p>
  <p><strong>Fecha de generación:</strong> ${formattedDate}</p>
  <p><strong>Operador:</strong> ${data.operator.businessName}</p>
  
  <hr>
  
  <!-- SECCIÓN 1: INFORMACIÓN LOGÍSTICA -->
  <h2>1. INFORMACIÓN LOGÍSTICA</h2>
  
  <h3>Fechas</h3>
  <p><strong>Inicio Programado:</strong> ${this.formatDateTime(data.operation.scheduledStartDate)}</p>
  <p><strong>Fin Programado:</strong> ${data.operation.scheduledEndDate ? this.formatDateTime(data.operation.scheduledEndDate) : 'No especificado'}</p>
  ${data.operation.actualStartDate ? `<p><strong>Inicio Real:</strong> ${this.formatDateTime(data.operation.actualStartDate)}</p>` : ''}
  ${data.operation.actualEndDate ? `<p><strong>Fin Real:</strong> ${this.formatDateTime(data.operation.actualEndDate)}</p>` : ''}
  
  <h3>Faenas (Origen y Destino)</h3>
  <p><strong>Origen:</strong> ${data.operation.origin}</p>
  <p><strong>Destino:</strong> ${data.operation.destination}</p>
  ${data.operation.distance ? `<p><strong>Distancia:</strong> ${data.operation.distance} km</p>` : ''}
  ${data.route ? `<p><strong>Ruta:</strong> ${data.route.name}</p>` : ''}
  
  <h3>Proveedor</h3>
  ${
    data.provider
      ? `
  <p><strong>Razón Social:</strong> ${data.provider.businessName}</p>
  ${data.provider.contactName ? `<p><strong>Contacto:</strong> ${data.provider.contactName}</p>` : ''}
  ${data.provider.contactPhone ? `<p><strong>Teléfono:</strong> ${data.provider.contactPhone}</p>` : ''}
  `
      : '<p>No se ha asignado proveedor</p>'
  }
  
  <h3>Información Adicional</h3>
  <p><strong>Tipo de Operación:</strong> ${this.formatOperationType(data.operation.operationType, language)}</p>
  <p><strong>Estado:</strong> ${this.formatStatus(data.operation.status, language)}</p>
  ${data.operation.cargoDescription ? `<p><strong>Descripción de Carga:</strong> ${data.operation.cargoDescription}</p>` : ''}
  ${data.operation.cargoWeight ? `<p><strong>Peso de Carga:</strong> ${data.operation.cargoWeight.toLocaleString()} kg</p>` : ''}
  
  <h3>Conductor y Vehículo</h3>
  <p><strong>Conductor:</strong> ${data.driver.firstName} ${data.driver.lastName}</p>
  <p><strong>Licencia:</strong> ${data.driver.licenseType}</p>
  ${data.driver.phone ? `<p><strong>Teléfono:</strong> ${data.driver.phone}</p>` : ''}
  <p><strong>Vehículo:</strong> ${data.vehicle.plateNumber} - ${data.vehicle.vehicleType}</p>
  ${data.vehicle.brand && data.vehicle.model ? `<p><strong>Marca/Modelo:</strong> ${data.vehicle.brand} ${data.vehicle.model}</p>` : ''}
  
  ${
    data.client
      ? `
  <h3>Cliente</h3>
  <p><strong>Razón Social:</strong> ${data.client.businessName}</p>
  ${data.client.contactName ? `<p><strong>Contacto:</strong> ${data.client.contactName}</p>` : ''}
  ${data.client.contactPhone ? `<p><strong>Teléfono:</strong> ${data.client.contactPhone}</p>` : ''}
  `
      : ''
  }
  
  <hr>
  
  <!-- SECCIÓN 2: EVIDENCIAS FOTOGRÁFICAS -->
  <h2>2. EVIDENCIAS FOTOGRÁFICAS</h2>
  <p>Espacio reservado para evidencias fotográficas de la operación.</p>
  <p>(Las fotografías deben adjuntarse por separado o integrarse a través del sistema de gestión documental)</p>
  
  <br><br><br>
  
  <hr>
  
  <!-- SECCIÓN 3: ENTREGA CONFORME Y OBSERVACIONES -->
  <h2>3. ENTREGA CONFORME Y OBSERVACIONES</h2>
  
  <h3>Observaciones</h3>
  ${data.operation.notes ? `<p>${data.operation.notes}</p>` : '<p>Sin observaciones registradas</p>'}
  
  <br><br>
  
  <h3>Firma de Entrega Conforme</h3>
  <p>Nombre: _________________________________________</p>
  <br>
  <p>Firma: _________________________________________</p>
  <br>
  <p>Fecha: _________________________________________</p>
  
  <hr>
  
  <footer>
    <p><small>Documento generado el ${formattedDate}</small></p>
    <p><small>Bilix Ingeniería - ${data.operator.businessName}</small></p>
  </footer>
</body>
</html>
    `;
  }

  private getLabels(language: string) {
    if (language === 'en') {
      return {
        reportTitle: 'Operation Report',
        operationNumber: 'Operation Number',
        generatedDate: 'Generated',
        operator: 'Operator',
        operationInfo: 'Operation Information',
        distance: 'Distance',
        route: 'Route',
        operationType: 'Type',
        status: 'Status',
        scheduledStart: 'Scheduled Start',
        scheduledEnd: 'Scheduled End',
        actualStart: 'Actual Start',
        actualEnd: 'Actual End',
        notSpecified: 'Not specified',
        cargoDescription: 'Cargo Description',
        cargoWeight: 'Cargo Weight',
        participants: 'Logistics Participants',
        client: 'Client',
        provider: 'Provider',
        driver: 'Driver',
        license: 'License',
        vehicle: 'Vehicle',
        vehicleType: 'Type',
        timeline: 'Timeline',
        operationCreated: 'Operation created and scheduled',
        operationStarted: 'Vehicle departed from origin',
        operationCompleted: 'Operation completed',
        photographicEvidence: 'Photographic Evidence',
        evidenceNote: 'Important',
        evidenceNoteText:
          'Photographic documentation should be attached separately or integrated through the document management system.',
        deliveryAndObservations: 'Delivery and Observations',
        observations: 'Observations',
        noObservations: 'No observations recorded',
        deliverySignature: 'Delivery Signature',
        nameAndSignature: 'Name and Signature',
        date: 'Date',
        confidentialDocument: 'Confidential Document',
        reportGenerated: 'Report generated on',
      };
    }

    // Spanish (default)
    return {
      reportTitle: 'Informe de Operación',
      operationNumber: 'Operación N°',
      generatedDate: 'Generado',
      operator: 'Operador',
      operationInfo: 'Información de la Operación',
      distance: 'Distancia',
      route: 'Ruta',
      operationType: 'Tipo',
      status: 'Estado',
      scheduledStart: 'Inicio Programado',
      scheduledEnd: 'Fin Programado',
      actualStart: 'Inicio Real',
      actualEnd: 'Fin Real',
      notSpecified: 'No especificado',
      cargoDescription: 'Descripción de Carga',
      cargoWeight: 'Peso de Carga',
      participants: 'Participantes Logísticos',
      client: 'Cliente',
      provider: 'Proveedor',
      driver: 'Conductor',
      license: 'Licencia',
      vehicle: 'Vehículo',
      vehicleType: 'Tipo',
      timeline: 'Línea de Tiempo',
      operationCreated: 'Operación creada y programada',
      operationStarted: 'Vehículo salió de origen',
      operationCompleted: 'Operación completada',
      photographicEvidence: 'Evidencias Fotográficas',
      evidenceNote: 'Nota Importante',
      evidenceNoteText:
        'La documentación fotográfica debe adjuntarse por separado o integrarse a través del sistema de gestión documental.',
      deliveryAndObservations: 'Entrega Conforme y Observaciones',
      observations: 'Observaciones',
      noObservations: 'Sin observaciones registradas',
      deliverySignature: 'Firma de Entrega Conforme',
      nameAndSignature: 'Nombre y Firma',
      date: 'Fecha',
      confidentialDocument: 'Documento Confidencial',
      reportGenerated: 'Informe generado el',
    };
  }

  private formatStatus(status: string, language: string): string {
    const statusMap: Record<string, Record<string, string>> = {
      es: {
        scheduled: 'Programada',
        confirmed: 'Confirmada',
        'in-progress': 'En Tránsito',
        completed: 'Completada',
        cancelled: 'Cancelada',
      },
      en: {
        scheduled: 'Scheduled',
        confirmed: 'Confirmed',
        'in-progress': 'In Transit',
        completed: 'Completed',
        cancelled: 'Cancelled',
      },
    };

    return statusMap[language]?.[status] || status;
  }

  private formatOperationType(type: string, language: string): string {
    const typeMap: Record<string, Record<string, string>> = {
      es: {
        delivery: 'Entrega',
        pickup: 'Retiro',
        transfer: 'Traslado',
        transport: 'Transporte',
        service: 'Servicio',
      },
      en: {
        delivery: 'Delivery',
        pickup: 'Pickup',
        transfer: 'Transfer',
        transport: 'Transport',
        service: 'Service',
      },
    };

    return typeMap[language]?.[type] || type;
  }

  private formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
