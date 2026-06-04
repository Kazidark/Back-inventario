import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import sql from 'mssql';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env') });

const excelPath =
  process.argv[2] || 'C:/Users/Pc/Desktop/execel modules/tablets.xlsx';

const pool = await sql.connect({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  port: Number(process.env.DB_PORT || 1433),
  database: process.env.DB_DATABASE,
  options: { encrypt: false, trustServerCertificate: true },
});
await pool.request().query('DELETE FROM tablets');
await pool.close();

const { NestFactory } = await import('@nestjs/core');
const { AppModule } = await import('../dist/app.module.js');
const { SubirArchivoService } = await import(
  '../dist/modules/subir-archivo/subir-archivo.service.js'
);

const buffer = readFileSync(excelPath);
const app = await NestFactory.createApplicationContext(AppModule, {
  logger: false,
});
const out = resolve(__dirname, '../import-tablets-result.json');
try {
  const service = app.get(SubirArchivoService);
  const result = await service.processExcelTablets({
    buffer,
    originalname: 'tablets.xlsx',
    mimetype:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: buffer.length,
  });
  writeFileSync(out, JSON.stringify(result, null, 2));
  console.log(result.message);
  console.log(JSON.stringify(result.summary, null, 2));
} catch (e) {
  writeFileSync(out, String(e?.stack || e));
  console.error(e?.message || e);
  process.exitCode = 1;
} finally {
  await app.close();
}
