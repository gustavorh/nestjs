import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import {
  operators,
  drivers,
  vehicles,
  operations,
  users,
  NewDriver,
  NewVehicle,
  NewOperation,
} from '../schema';

/**
 * Seeds the database with sample Chilean data for testing and development
 */
export async function seedSampleData(db: MySql2Database): Promise<void> {
  console.log('🎲 Starting sample data seed...');

  try {
    // ========================================================================
    // GET BILIX OPERATOR
    // ========================================================================
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

    // Get admin user for createdBy
    const [adminUser] = await db
      .select()
      .from(users)
      .where(eq(users.username, 'admin'))
      .limit(1);

    const createdBy = adminUser?.id || null;

    // ========================================================================
    // SAMPLE CHILEAN NAMES
    // ========================================================================
    const chileanFirstNames = {
      male: [
        'Juan',
        'Pedro',
        'Carlos',
        'José',
        'Luis',
        'Miguel',
        'Jorge',
        'Andrés',
        'Francisco',
        'Diego',
        'Roberto',
        'Cristian',
        'Sebastián',
        'Rodrigo',
        'Mauricio',
        'Fernando',
        'Ricardo',
        'Felipe',
        'Claudio',
        'Marcelo',
      ],
      female: [
        'María',
        'Carmen',
        'Patricia',
        'Rosa',
        'Ana',
        'Gloria',
        'Lorena',
        'Claudia',
        'Alejandra',
        'Carolina',
        'Verónica',
        'Mónica',
        'Paola',
        'Andrea',
        'Daniela',
        'Gabriela',
        'Soledad',
        'Constanza',
        'Javiera',
        'Francisca',
      ],
    };

    const chileanLastNames = [
      'González',
      'Muñoz',
      'Rojas',
      'Díaz',
      'Pérez',
      'Soto',
      'Contreras',
      'Silva',
      'Martínez',
      'Sepúlveda',
      'Morales',
      'Rodríguez',
      'López',
      'Fuentes',
      'Hernández',
      'Torres',
      'Araya',
      'Flores',
      'Espinoza',
      'Valenzuela',
      'Castillo',
      'Núñez',
      'Tapia',
      'Reyes',
      'Gutiérrez',
    ];

    const chileanCities = [
      { city: 'Santiago', region: 'Metropolitana' },
      { city: 'Valparaíso', region: 'Valparaíso' },
      { city: 'Concepción', region: 'Biobío' },
      { city: 'La Serena', region: 'Coquimbo' },
      { city: 'Antofagasta', region: 'Antofagasta' },
      { city: 'Temuco', region: 'Araucanía' },
      { city: 'Rancagua', region: "O'Higgins" },
      { city: 'Talca', region: 'Maule' },
      { city: 'Arica', region: 'Arica y Parinacota' },
      { city: 'Puerto Montt', region: 'Los Lagos' },
      { city: 'Chillán', region: 'Ñuble' },
      { city: 'Iquique', region: 'Tarapacá' },
      { city: 'Los Ángeles', region: 'Biobío' },
      { city: 'Calama', region: 'Antofagasta' },
      { city: 'Osorno', region: 'Los Lagos' },
      { city: 'Valdivia', region: 'Los Ríos' },
      { city: 'Quillota', region: 'Valparaíso' },
      { city: 'Curicó', region: 'Maule' },
      { city: 'Copiapó', region: 'Atacama' },
      { city: 'Punta Arenas', region: 'Magallanes' },
    ];

    const vehicleBrands = [
      { brand: 'Freightliner', models: ['Cascadia', 'M2 106', 'Coronado'] },
      { brand: 'Volvo', models: ['FH', 'FM', 'FMX'] },
      { brand: 'Mercedes-Benz', models: ['Actros', 'Atego', 'Axor'] },
      { brand: 'Scania', models: ['R Series', 'P Series', 'G Series'] },
      { brand: 'MAN', models: ['TGX', 'TGS', 'TGL'] },
      { brand: 'Iveco', models: ['Stralis', 'Trakker', 'Eurocargo'] },
      { brand: 'DAF', models: ['XF', 'CF', 'LF'] },
      { brand: 'Kenworth', models: ['T800', 'T680', 'W900'] },
    ];

    const vehicleColors = [
      'Blanco',
      'Rojo',
      'Azul',
      'Verde',
      'Amarillo',
      'Gris',
      'Negro',
      'Naranja',
    ];

    const operationTypes = [
      'Transporte de Carga',
      'Distribución',
      'Mudanza',
      'Transporte de Materiales',
      'Logística',
    ];

    // Helper functions
    function randomItem<T>(array: T[]): T {
      return array[Math.floor(Math.random() * array.length)];
    }

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

      return `${num.toString().slice(0, -3)}.${num.toString().slice(-3)}-${dvFinal}`;
    }

    function generatePlateNumber(): string {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const plate =
        letters[randomInt(0, 25)] +
        letters[randomInt(0, 25)] +
        letters[randomInt(0, 25)] +
        letters[randomInt(0, 25)] +
        randomInt(10, 99);
      return plate;
    }

    function generateEmail(firstName: string, lastName: string): string {
      return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.cl`;
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
      const day = randomInt(1, 28); // Use 28 to avoid end-of-month issues
      // Create date at noon UTC to avoid timezone issues
      // MySQL timestamp has range 1970-01-01 to 2038-01-19
      return new Date(Date.UTC(year, month, day, 12, 0, 0));
    }

    // ========================================================================
    // SEED DRIVERS
    // ========================================================================
    console.log('👨‍✈️ Creating sample drivers...');

    const licenseTypes = ['A1', 'A2', 'A3', 'A4', 'A5', 'B', 'C', 'D'];
    const driversData: NewDriver[] = [];

    for (let i = 0; i < 25; i++) {
      const isMale = Math.random() > 0.1; // 90% male drivers
      const firstName = randomItem(
        isMale ? chileanFirstNames.male : chileanFirstNames.female,
      );
      const lastName1 = randomItem(chileanLastNames);
      const lastName2 = randomItem(chileanLastNames);
      const location = randomItem(chileanCities);
      const licenseExpDate = addMonths(new Date(), randomInt(3, 36));

      driversData.push({
        operatorId,
        rut: generateRUT(),
        firstName,
        lastName: `${lastName1} ${lastName2}`,
        email: generateEmail(firstName, lastName1),
        phone: generatePhone(),
        emergencyContactName: `${randomItem(chileanFirstNames.female)} ${randomItem(chileanLastNames)}`,
        emergencyContactPhone: generatePhone(),
        licenseType: randomItem(licenseTypes),
        licenseNumber: `${randomInt(100000, 999999)}`,
        licenseExpirationDate: licenseExpDate,
        dateOfBirth: generateDateOfBirth(1970, 2000), // MySQL timestamp range: 1970-2038
        address: `${randomItem(['Av.', 'Calle', 'Pasaje'])} ${randomItem(chileanLastNames)} ${randomInt(100, 9999)}`,
        city: location.city,
        region: location.region,
        status: Math.random() > 0.1, // 90% active
        isExternal: Math.random() > 0.7, // 30% external
        externalCompany:
          Math.random() > 0.7
            ? `Transportes ${randomItem(chileanLastNames)}`
            : null,
        notes: Math.random() > 0.5 ? 'Conductor experimentado' : null,
        createdBy,
      });
    }

    const insertedDrivers = await db
      .insert(drivers)
      .values(driversData)
      .$returningId();
    console.log(`✅ Created ${insertedDrivers.length} drivers`);

    // ========================================================================
    // SEED VEHICLES
    // ========================================================================
    console.log('🚛 Creating sample vehicles...');

    const vehiclesData: NewVehicle[] = [];

    for (let i = 0; i < 30; i++) {
      const brandData = randomItem(vehicleBrands);
      const year = randomInt(2010, 2024);

      vehiclesData.push({
        operatorId,
        plateNumber: generatePlateNumber(),
        brand: brandData.brand,
        model: randomItem(brandData.models),
        year,
        vehicleType: randomItem(['Camión', 'Camioneta', 'Furgón']),
        capacity: randomInt(1000, 25000),
        capacityUnit: 'kg',
        vin: `${Math.random().toString(36).substring(2, 15).toUpperCase()}${randomInt(100000, 999999)}`,
        color: randomItem(vehicleColors),
        status: Math.random() > 0.15, // 85% active
        notes: Math.random() > 0.5 ? 'Vehículo en buenas condiciones' : null,
        createdBy,
      });
    }

    const insertedVehicles = await db
      .insert(vehicles)
      .values(vehiclesData)
      .$returningId();
    console.log(`✅ Created ${insertedVehicles.length} vehicles`);

    // ========================================================================
    // SEED OPERATIONS
    // ========================================================================
    console.log('📦 Creating sample operations...');

    const operationsData: NewOperation[] = [];

    for (let i = 0; i < 50; i++) {
      const origin = randomItem(chileanCities);
      const destination = randomItem(
        chileanCities.filter((c) => c.city !== origin.city),
      );
      const scheduledStart = addDays(new Date(), randomInt(-30, 30));
      const scheduledEnd = addDays(scheduledStart, randomInt(1, 5));
      const status = randomItem([
        'scheduled',
        'in-progress',
        'completed',
        'cancelled',
      ]);

      let actualStart: Date | null = null;
      let actualEnd: Date | null = null;

      if (status === 'in-progress' || status === 'completed') {
        actualStart = addDays(scheduledStart, randomInt(-1, 1));
      }

      if (status === 'completed') {
        actualEnd = addDays(scheduledEnd, randomInt(-1, 1));
      }

      operationsData.push({
        operatorId,
        driverId: insertedDrivers[randomInt(0, insertedDrivers.length - 1)].id,
        vehicleId:
          insertedVehicles[randomInt(0, insertedVehicles.length - 1)].id,
        operationNumber: `OP-${new Date().getFullYear()}-${String(i + 1).padStart(5, '0')}`,
        operationType: randomItem(operationTypes),
        origin: `${origin.city}, ${origin.region}`,
        destination: `${destination.city}, ${destination.region}`,
        scheduledStartDate: scheduledStart,
        scheduledEndDate: scheduledEnd,
        actualStartDate: actualStart,
        actualEndDate: actualEnd,
        distance: randomInt(50, 2000),
        status,
        cargoDescription: `Carga general - ${randomItem(['Alimentos', 'Materiales', 'Equipos', 'Mercadería'])}`,
        cargoWeight: randomInt(500, 20000),
        notes: Math.random() > 0.5 ? 'Operación sin novedades' : null,
        createdBy,
      });
    }

    const insertedOperations = await db
      .insert(operations)
      .values(operationsData)
      .$returningId();
    console.log(`✅ Created ${insertedOperations.length} operations`);

    console.log('\n📊 Sample Data Summary:');
    console.log(`   👨‍✈️ Drivers: ${insertedDrivers.length}`);
    console.log(`   🚛 Vehicles: ${insertedVehicles.length}`);
    console.log(`   📦 Operations: ${insertedOperations.length}`);

    console.log('✅ Sample data seed completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding sample data:', error);
    throw error;
  }
}
