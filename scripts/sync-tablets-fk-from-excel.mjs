/**
 * Rellena estado_tablet, estado_equipo y ubicacion desde tablets.xlsx
 * sin borrar registros (solo UPDATE por IMEI).
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env') });

const excelPath =
  process.argv[2] || 'C:/Users/Pc/Desktop/execel modules/tablets.xlsx';

const { NestFactory } = await import('@nestjs/core');
const { AppModule } = await import('../dist/app.module.js');
const { SubirArchivoService } = await import(
  '../dist/modules/subir-archivo/subir-archivo.service.js'
);

const buffer = readFileSync(excelPath);
const app = await NestFactory.createApplicationContext(AppModule, {
  logger: ['error', 'warn'],
});

try {
  const service = app.get(SubirArchivoService);
  const result = await service.processExcelTablets({
    buffer,
    originalname: 'tablets.xlsx',
    mimetype:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: buffer.length,
  });
  console.log(result.message);
  console.log('importVersion:', result.importVersion);
  console.log('summary:', result.summary);
} finally {
  await app.close();
}
