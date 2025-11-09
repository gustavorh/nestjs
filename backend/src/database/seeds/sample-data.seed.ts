import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import {
  operators,
  drivers,
  vehicles,
  operations,
  users,
  clients,
  providers,
  routes,
  NewDriver,
  NewVehicle,
  NewOperation,
  NewClient,
  NewProvider,
  NewRoute,
} from '../schema';

/**
 * Seeds the database with sample Chilean data for testing and development
 * Maximum of 5 records per table for concise testing
 */
export async function seedSampleData(db: MySql2Database): Promise<void> {
  console.log('🎲 Starting sample data seed...');

  try {
    const [bilixOperator] = await db
      .select()
      .from(operators)
      .where(eq(operators.rut, '12345678-9'))
      .limit(1);

    if (!bilixOperator) {
      throw new Error('Bilix operator not found. Run permissions seed first.');
    }

    const operatorId = bilixOperator.id;
    console.log(`✅ Using operator: ${bilixOperator.name} (ID: ${operatorId})`);

    const [adminUser] = await db
      .select()
      .from(users)
      .where(eq(users.username, 'admin'))
      .limit(1);

    const createdBy = adminUser?.id || null;

    function randomInt(min: number, max: number): number {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function generateRUT(): string {
      const num = randomInt(10000000, 25000000);
      let suma = 0;
      let multiplo = 2;

      for (let i = num.toString().length - 1; i >= 0; i--) {
        suma += parseInt(num.toString()[i]) * multiplo;
        multiplo = multiplo === 7 ? 2 : multiplo + 1;
      }

      const dv = 11 - (suma % 11);
      const dvFinal = dv === 11 ? '0' : dv === 10 ? 'K' : dv.toString();

      return `${num}-${dvFinal}`;
    }

    function generatePlateNumber(): string {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      return (
        letters[randomInt(0, 25)] +
        letters[randomInt(0, 25)] +
        letters[randomInt(0, 25)] +
        letters[randomInt(0, 25)] +
        randomInt(10, 99)
      );
    }

    function generatePhone(): string {
      return `+569 ${randomInt(1000, 9999)} ${randomInt(1000, 9999)}`;
    }

    function addDays(date: Date, days: number): Date {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    }

    function addMonths(date: Date, months: number): Date {
      const result = new Date(date);
      result.setMonth(result.getMonth() + months);
      return result;
    }

    function generateDateOfBirth(minYear: number, maxYear: number): Date {
      const year = randomInt(minYear, maxYear);
      const month = randomInt(0, 11);
      const day = randomInt(1, 28);
      return new Date(Date.UTC(year, month, day, 12, 0, 0));
    }

    // ========================================================================
    // SEED CLIENTS (5 records)
    // ========================================================================
    console.log('🏢 Creating sample clients...');

    const clientsData: NewClient[] = [
      {
        operatorId,
        businessName: 'Minera Las Águilas S.A.',
        taxId: generateRUT(),
        contactName: 'Carlos Pérez',
        contactEmail: 'carlos.perez@mineraaguilas.cl',
        contactPhone: generatePhone(),
        address: "Av. Libertador Bernardo O'Higgins 1230",
        city: 'Santiago',
        region: 'Metropolitana',
        country: 'Chile',
        industry: 'Minería',
        status: true,
        createdBy,
      },
      {
        operatorId,
        businessName: 'Constructora del Sur Ltda.',
        taxId: generateRUT(),
        contactName: 'María González',
        contactEmail: 'maria.gonzalez@constructoradelsur.cl',
        contactPhone: generatePhone(),
        address: 'Calle Arturo Prat 456',
        city: 'Concepción',
        region: 'Biobío',
        country: 'Chile',
        industry: 'Construcción',
        status: true,
        createdBy,
      },
      {
        operatorId,
        businessName: 'Agrícola Valle Verde S.A.',
        taxId: generateRUT(),
        contactName: 'Juan Rodríguez',
        contactEmail: 'juan.rodriguez@valleverde.cl',
        contactPhone: generatePhone(),
        address: 'Camino Rural km 15',
        city: 'Curicó',
        region: 'Maule',
        country: 'Chile',
        industry: 'Agricultura',
        status: true,
        createdBy,
      },
      {
        operatorId,
        businessName: 'Industrial Metálica SpA',
        taxId: generateRUT(),
        contactName: 'Patricia Silva',
        contactEmail: 'patricia.silva@metalica.cl',
        contactPhone: generatePhone(),
        address: 'Av. Los Industriales 890',
        city: 'Valparaíso',
        region: 'Valparaíso',
        country: 'Chile',
        industry: 'Industrial',
        status: true,
        createdBy,
      },
      {
        operatorId,
        businessName: 'Distribuidora Nacional Ltda.',
        taxId: generateRUT(),
        contactName: 'Roberto Muñoz',
        contactEmail: 'roberto.munoz@distribuidoranacional.cl',
        contactPhone: generatePhone(),
        address: 'Av. Grecia 2340',
        city: 'Antofagasta',
        region: 'Antofagasta',
        country: 'Chile',
        industry: 'Distribución',
        status: true,
        createdBy,
      },
    ];

    const insertedClients = await db
      .insert(clients)
      .values(clientsData)
      .$returningId();
    console.log(`✅ Created ${insertedClients.length} clients`);

    // ========================================================================
    // SEED PROVIDERS (5 records)
    // ========================================================================
    console.log('🚚 Creating sample providers...');

    const providersData: NewProvider[] = [
      {
        operatorId,
        businessName: 'Transportes Rápidos del Norte S.A.',
        taxId: generateRUT(),
        contactName: 'Andrés Flores',
        contactEmail: 'andres.flores@rapidosnorte.cl',
        contactPhone: generatePhone(),
        address: 'Av. Pedro de Valdivia 1890',
        city: 'La Serena',
        region: 'Coquimbo',
        country: 'Chile',
        businessType: 'Transporte de Carga',
        serviceTypes: 'Carga seca, Refrigerado',
        fleetSize: 25,
        status: true,
        rating: 5,
        createdBy,
      },
      {
        operatorId,
        businessName: 'Logística Austral Ltda.',
        taxId: generateRUT(),
        contactName: 'Claudia Soto',
        contactEmail: 'claudia.soto@logisticaaustral.cl',
        contactPhone: generatePhone(),
        address: 'Av. España 567',
        city: 'Puerto Montt',
        region: 'Los Lagos',
        country: 'Chile',
        businessType: 'Operador Logístico',
        serviceTypes: 'Almacenamiento, Distribución, Transporte',
        fleetSize: 40,
        status: true,
        rating: 4,
        createdBy,
      },
      {
        operatorId,
        businessName: 'Transportes Cordillera SpA',
        taxId: generateRUT(),
        contactName: 'Fernando Castillo',
        contactEmail: 'fernando.castillo@transcordillera.cl',
        contactPhone: generatePhone(),
        address: 'Camino a Farellones 234',
        city: 'Santiago',
        region: 'Metropolitana',
        country: 'Chile',
        businessType: 'Transporte Especializado',
        serviceTypes: 'Carga pesada, Maquinaria',
        fleetSize: 15,
        status: true,
        rating: 5,
        createdBy,
      },
      {
        operatorId,
        businessName: 'Express Cargo Chile Ltda.',
        taxId: generateRUT(),
        contactName: 'Lorena Tapia',
        contactEmail: 'lorena.tapia@expresscargo.cl',
        contactPhone: generatePhone(),
        address: 'Av. Colón 890',
        city: 'Iquique',
        region: 'Tarapacá',
        country: 'Chile',
        businessType: 'Transporte Express',
        serviceTypes: 'Courier, Paquetería, Documentos',
        fleetSize: 30,
        status: true,
        rating: 4,
        createdBy,
      },
      {
        operatorId,
        businessName: 'Transportes Región del Maule S.A.',
        taxId: generateRUT(),
        contactName: 'Miguel Reyes',
        contactEmail: 'miguel.reyes@transportemaule.cl',
        contactPhone: generatePhone(),
        address: '1 Norte 1234',
        city: 'Talca',
        region: 'Maule',
        country: 'Chile',
        businessType: 'Transporte Regional',
        serviceTypes: 'Carga general, Agrícola',
        fleetSize: 20,
        status: true,
        rating: 3,
        createdBy,
      },
    ];

    const insertedProviders = await db
      .insert(providers)
      .values(providersData)
      .$returningId();
    console.log(`✅ Created ${insertedProviders.length} providers`);

    // ========================================================================
    // SEED ROUTES (5 records)
    // ========================================================================
    console.log('🛣️ Creating sample routes...');

    const routesData: NewRoute[] = [
      {
        operatorId,
        name: 'Santiago - Valparaíso',
        code: 'RUT-001',
        origin: 'Santiago, Región Metropolitana',
        destination: 'Valparaíso, Región de Valparaíso',
        distance: 120,
        estimatedDuration: 90,
        routeType: 'Interurbana',
        difficulty: 'Fácil',
        roadConditions: 'Autopista en buen estado',
        tollsRequired: true,
        estimatedTollCost: 5000,
        status: true,
        createdBy,
      },
      {
        operatorId,
        name: 'Antofagasta - Calama',
        code: 'RUT-002',
        origin: 'Antofagasta, Región de Antofagasta',
        destination: 'Calama, Región de Antofagasta',
        distance: 215,
        estimatedDuration: 180,
        routeType: 'Minera',
        difficulty: 'Moderada',
        roadConditions: 'Ruta desértica, buen estado',
        tollsRequired: false,
        status: true,
        createdBy,
      },
      {
        operatorId,
        name: 'Concepción - Temuco',
        code: 'RUT-003',
        origin: 'Concepción, Región del Biobío',
        destination: 'Temuco, Región de la Araucanía',
        distance: 280,
        estimatedDuration: 210,
        routeType: 'Interurbana',
        difficulty: 'Moderada',
        roadConditions: 'Ruta 5 Sur, buen estado',
        tollsRequired: true,
        estimatedTollCost: 8000,
        status: true,
        createdBy,
      },
      {
        operatorId,
        name: 'La Serena - Coquimbo',
        code: 'RUT-004',
        origin: 'La Serena, Región de Coquimbo',
        destination: 'Coquimbo, Región de Coquimbo',
        distance: 12,
        estimatedDuration: 20,
        routeType: 'Urbana',
        difficulty: 'Fácil',
        roadConditions: 'Avenida costera, buen estado',
        tollsRequired: false,
        status: true,
        createdBy,
      },
      {
        operatorId,
        name: 'Puerto Montt - Castro',
        code: 'RUT-005',
        origin: 'Puerto Montt, Región de Los Lagos',
        destination: 'Castro, Región de Los Lagos',
        distance: 85,
        estimatedDuration: 120,
        routeType: 'Rural',
        difficulty: 'Moderada',
        roadConditions: 'Ruta 5, incluye ferry',
        tollsRequired: false,
        status: true,
        observations: 'Incluye cruce en ferry',
        createdBy,
      },
    ];

    const insertedRoutes = await db
      .insert(routes)
      .values(routesData)
      .$returningId();
    console.log(`✅ Created ${insertedRoutes.length} routes`);

    // ========================================================================
    // SEED DRIVERS (5 records)
    // ========================================================================
    console.log('👨‍✈️ Creating sample drivers...');

    const driversData: NewDriver[] = [
      {
        operatorId,
        rut: generateRUT(),
        firstName: 'Juan',
        lastName: 'Pérez González',
        email: 'juan.perez@example.cl',
        phone: generatePhone(),
        emergencyContactName: 'María Pérez',
        emergencyContactPhone: generatePhone(),
        licenseType: 'A2',
        licenseNumber: '123456789',
        licenseExpirationDate: addMonths(new Date(), 24),
        dateOfBirth: generateDateOfBirth(1975, 1990),
        address: 'Av. Las Condes 1234',
        city: 'Santiago',
        region: 'Metropolitana',
        status: true,
        isExternal: false,
        notes: 'Conductor experimentado',
        createdBy,
      },
      {
        operatorId,
        rut: generateRUT(),
        firstName: 'Pedro',
        lastName: 'Rodríguez Silva',
        email: 'pedro.rodriguez@example.cl',
        phone: generatePhone(),
        emergencyContactName: 'Ana Rodríguez',
        emergencyContactPhone: generatePhone(),
        licenseType: 'A3',
        licenseNumber: '987654321',
        licenseExpirationDate: addMonths(new Date(), 18),
        dateOfBirth: generateDateOfBirth(1980, 1995),
        address: 'Calle Principal 567',
        city: 'Valparaíso',
        region: 'Valparaíso',
        status: true,
        isExternal: false,
        createdBy,
      },
      {
        operatorId,
        rut: generateRUT(),
        firstName: 'Carlos',
        lastName: 'Muñoz Díaz',
        email: 'carlos.munoz@example.cl',
        phone: generatePhone(),
        emergencyContactName: 'Gloria Muñoz',
        emergencyContactPhone: generatePhone(),
        licenseType: 'A4',
        licenseNumber: '456789123',
        licenseExpirationDate: addMonths(new Date(), 12),
        dateOfBirth: generateDateOfBirth(1978, 1992),
        address: "Av. O'Higgins 890",
        city: 'Concepción',
        region: 'Biobío',
        status: true,
        isExternal: false,
        createdBy,
      },
      {
        operatorId,
        rut: generateRUT(),
        firstName: 'Luis',
        lastName: 'Soto Contreras',
        email: 'luis.soto@example.cl',
        phone: generatePhone(),
        emergencyContactName: 'Patricia Soto',
        emergencyContactPhone: generatePhone(),
        licenseType: 'A2',
        licenseNumber: '321654987',
        licenseExpirationDate: addMonths(new Date(), 30),
        dateOfBirth: generateDateOfBirth(1982, 1996),
        address: 'Pasaje Los Robles 234',
        city: 'La Serena',
        region: 'Coquimbo',
        status: true,
        isExternal: true,
        externalCompany: 'Transportes del Norte',
        createdBy,
      },
      {
        operatorId,
        rut: generateRUT(),
        firstName: 'Jorge',
        lastName: 'Torres Morales',
        email: 'jorge.torres@example.cl',
        phone: generatePhone(),
        emergencyContactName: 'Carmen Torres',
        emergencyContactPhone: generatePhone(),
        licenseType: 'A3',
        licenseNumber: '789456123',
        licenseExpirationDate: addMonths(new Date(), 20),
        dateOfBirth: generateDateOfBirth(1985, 1998),
        address: 'Av. Costanera 567',
        city: 'Puerto Montt',
        region: 'Los Lagos',
        status: true,
        isExternal: false,
        createdBy,
      },
    ];

    const insertedDrivers = await db
      .insert(drivers)
      .values(driversData)
      .$returningId();
    console.log(`✅ Created ${insertedDrivers.length} drivers`);

    // ========================================================================
    // SEED VEHICLES (5 records)
    // ========================================================================
    console.log('🚛 Creating sample vehicles...');

    const vehiclesData: NewVehicle[] = [
      {
        operatorId,
        plateNumber: generatePlateNumber(),
        brand: 'Volvo',
        model: 'FH 540',
        year: 2020,
        vehicleType: 'Camión',
        capacity: 25000,
        capacityUnit: 'kg',
        vin: 'YV2A22B70KA123456',
        color: 'Blanco',
        status: true,
        createdBy,
      },
      {
        operatorId,
        plateNumber: generatePlateNumber(),
        brand: 'Mercedes-Benz',
        model: 'Actros 2646',
        year: 2019,
        vehicleType: 'Camión',
        capacity: 26000,
        capacityUnit: 'kg',
        vin: 'WDB9340341K123456',
        color: 'Azul',
        status: true,
        createdBy,
      },
      {
        operatorId,
        plateNumber: generatePlateNumber(),
        brand: 'Scania',
        model: 'R 450',
        year: 2021,
        vehicleType: 'Camión',
        capacity: 24000,
        capacityUnit: 'kg',
        vin: 'YS2R4X20005123456',
        color: 'Rojo',
        status: true,
        createdBy,
      },
      {
        operatorId,
        plateNumber: generatePlateNumber(),
        brand: 'Freightliner',
        model: 'Cascadia',
        year: 2018,
        vehicleType: 'Camión',
        capacity: 23000,
        capacityUnit: 'kg',
        vin: '3AKJHHDR5JSKS1234',
        color: 'Gris',
        status: true,
        createdBy,
      },
      {
        operatorId,
        plateNumber: generatePlateNumber(),
        brand: 'Iveco',
        model: 'Stralis 480',
        year: 2022,
        vehicleType: 'Camión',
        capacity: 25500,
        capacityUnit: 'kg',
        vin: 'WJME2NTH400123456',
        color: 'Verde',
        status: true,
        createdBy,
      },
    ];

    const insertedVehicles = await db
      .insert(vehicles)
      .values(vehiclesData)
      .$returningId();
    console.log(`✅ Created ${insertedVehicles.length} vehicles`);

    // ========================================================================
    // SEED OPERATIONS (5 records)
    // ========================================================================
    console.log('📦 Creating sample operations...');

    const operationsData: NewOperation[] = [
      {
        operatorId,
        clientId: insertedClients[0].id,
        providerId: null,
        routeId: insertedRoutes[0].id,
        driverId: insertedDrivers[0].id,
        vehicleId: insertedVehicles[0].id,
        operationNumber: `OP-${new Date().getFullYear()}-00001`,
        operationType: 'Transporte de Carga',
        origin: 'Santiago, Región Metropolitana',
        destination: 'Valparaíso, Región de Valparaíso',
        scheduledStartDate: addDays(new Date(), 1),
        scheduledEndDate: addDays(new Date(), 1),
        status: 'scheduled',
        cargoDescription: 'Materiales de construcción',
        cargoWeight: 15000,
        distance: 120,
        createdBy,
      },
      {
        operatorId,
        clientId: insertedClients[1].id,
        providerId: insertedProviders[0].id,
        routeId: insertedRoutes[1].id,
        driverId: insertedDrivers[1].id,
        vehicleId: insertedVehicles[1].id,
        operationNumber: `OP-${new Date().getFullYear()}-00002`,
        operationType: 'Transporte Minero',
        origin: 'Antofagasta, Región de Antofagasta',
        destination: 'Calama, Región de Antofagasta',
        scheduledStartDate: addDays(new Date(), -2),
        scheduledEndDate: addDays(new Date(), -1),
        actualStartDate: addDays(new Date(), -2),
        actualEndDate: addDays(new Date(), -1),
        status: 'completed',
        cargoDescription: 'Insumos mineros',
        cargoWeight: 20000,
        distance: 215,
        createdBy,
      },
      {
        operatorId,
        clientId: insertedClients[2].id,
        providerId: null,
        routeId: insertedRoutes[2].id,
        driverId: insertedDrivers[2].id,
        vehicleId: insertedVehicles[2].id,
        operationNumber: `OP-${new Date().getFullYear()}-00003`,
        operationType: 'Distribución',
        origin: 'Concepción, Región del Biobío',
        destination: 'Temuco, Región de la Araucanía',
        scheduledStartDate: new Date(),
        scheduledEndDate: addDays(new Date(), 1),
        actualStartDate: new Date(),
        status: 'in-progress',
        cargoDescription: 'Productos agrícolas',
        cargoWeight: 12000,
        distance: 280,
        createdBy,
      },
      {
        operatorId,
        clientId: insertedClients[3].id,
        providerId: insertedProviders[1].id,
        routeId: insertedRoutes[3].id,
        driverId: insertedDrivers[3].id,
        vehicleId: insertedVehicles[3].id,
        operationNumber: `OP-${new Date().getFullYear()}-00004`,
        operationType: 'Transporte Industrial',
        origin: 'La Serena, Región de Coquimbo',
        destination: 'Coquimbo, Región de Coquimbo',
        scheduledStartDate: addDays(new Date(), 3),
        scheduledEndDate: addDays(new Date(), 3),
        status: 'scheduled',
        cargoDescription: 'Equipos industriales',
        cargoWeight: 18000,
        distance: 12,
        createdBy,
      },
      {
        operatorId,
        clientId: insertedClients[4].id,
        providerId: null,
        routeId: insertedRoutes[4].id,
        driverId: insertedDrivers[4].id,
        vehicleId: insertedVehicles[4].id,
        operationNumber: `OP-${new Date().getFullYear()}-00005`,
        operationType: 'Logística',
        origin: 'Puerto Montt, Región de Los Lagos',
        destination: 'Castro, Región de Los Lagos',
        scheduledStartDate: addDays(new Date(), -5),
        scheduledEndDate: addDays(new Date(), -5),
        status: 'cancelled',
        cargoDescription: 'Mercadería general',
        cargoWeight: 10000,
        distance: 85,
        notes: 'Cancelado por condiciones climáticas',
        createdBy,
      },
    ];

    const insertedOperations = await db
      .insert(operations)
      .values(operationsData)
      .$returningId();
    console.log(`✅ Created ${insertedOperations.length} operations`);

    console.log('\n📊 Sample Data Summary:');
    console.log(`   🏢 Clients: ${insertedClients.length}`);
    console.log(`   🚚 Providers: ${insertedProviders.length}`);
    console.log(`   🛣️ Routes: ${insertedRoutes.length}`);
    console.log(`   👨‍✈️ Drivers: ${insertedDrivers.length}`);
    console.log(`   🚛 Vehicles: ${insertedVehicles.length}`);
    console.log(`   📦 Operations: ${insertedOperations.length}`);

    console.log('Creating sample data - 5 records per table maximum');
    console.log(`✅ Sample data seed completed successfully!`);
  } catch (error) {
    console.error('❌ Error seeding sample data:', error);
    throw error;
  }
}
