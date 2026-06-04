/**
 * Importa laptos.xlsx directo a la BD (sin levantar HTTP).
 * Uso: node scripts/import-laptos.mjs
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env') });

const excelPath =
  process.argv[2] ||
  'C:/Users/Pc/Desktop/execel modules/laptos.xlsx';

const { NestFactory } = await import('@nestjs/core');
const { AppModule } = await import('../dist/app.module.js');
const { SubirArchivoService } = await import(
  '../dist/modules/subir-archivo/subir-archivo.service.js'
);

const buffer = readFileSync(excelPath);
const app = await NestFactory.createApplicationContext(AppModule, {
  logger: ['error', 'warn', 'log'],
});

try {
  const service = app.get(SubirArchivoService);
  const result = await service.processExcelLaptos({
    buffer,
    originalname: 'laptos.xlsx',
    mimetype:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: buffer.length,
  });
  console.log(JSON.stringify(result, null, 2));
} finally {
  await app.close();
}
