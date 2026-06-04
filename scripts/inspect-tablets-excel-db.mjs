import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import ExcelJS from 'exceljs';
import sql from 'mssql';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env') });

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile('C:/Users/Pc/Desktop/execel modules/tablets.xlsx');
const ws = wb.worksheets[0];
console.log('=== HEADERS ===');
ws.getRow(1).eachCell({ includeEmpty: false }, (c, col) => {
  console.log(col, String(c.value ?? '').trim());
});

const pool = await sql.connect({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  port: Number(process.env.DB_PORT || 1433),
  database: process.env.DB_DATABASE,
  options: { encrypt: false, trustServerCertificate: true },
});

const cols = await pool.request().query(`
  SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'tablets'
  ORDER BY ORDINAL_POSITION
`);
console.log('\n=== TABLETS COLUMNS ===');
console.log(cols.recordset);

const stats = await pool.request().query(`
  SELECT COUNT(*) total,
    SUM(CASE WHEN estado_tablet IS NULL THEN 1 ELSE 0 END) null_et,
    SUM(CASE WHEN estado_equipo IS NULL THEN 1 ELSE 0 END) null_ee,
    SUM(CASE WHEN ubicacion IS NULL THEN 1 ELSE 0 END) null_ub
  FROM tablets
`);
console.log('\n=== STATS ===', stats.recordset[0]);

const sample = await pool.request().query(`
  SELECT TOP 5 * FROM tablets ORDER BY id_tablet
`);
console.log('\n=== SAMPLE ROW ===', sample.recordset[0]);

await pool.close();
