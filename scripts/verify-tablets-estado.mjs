import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import sql from 'mssql';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env') });

const pool = await sql.connect({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  port: Number(process.env.DB_PORT || 1433),
  database: process.env.DB_DATABASE,
  options: { encrypt: false, trustServerCertificate: true },
});

const counts = await pool.request().query(`
  SELECT COUNT(*) total,
    SUM(CASE WHEN estado_tablet IS NULL THEN 1 ELSE 0 END) null_et,
    SUM(CASE WHEN estado_equipo IS NULL THEN 1 ELSE 0 END) null_ee,
    SUM(CASE WHEN ubicacion IS NULL THEN 1 ELSE 0 END) null_ub
  FROM tablets
`);
console.log('counts', counts.recordset[0]);

const sample = await pool.request().query(`
  SELECT TOP 5 t.imei_tablet,
    t.estado_tablet, e.descripcion op,
    t.estado_equipo, a.descripcion eq,
    t.ubicacion, u.descripcion ub
  FROM tablets t
  LEFT JOIN TBLM_estados_equipo e ON t.estado_tablet = e.id_estado
  LEFT JOIN TBLM_asignacion a ON t.estado_equipo = a.id_asignado
  LEFT JOIN TBLM_ubicacion u ON t.ubicacion = u.id
  ORDER BY t.id_tablet
`);
console.log('sample', sample.recordset);

const asig = await pool.request().query(
  'SELECT id_asignado, descripcion FROM TBLM_asignacion ORDER BY id_asignado',
);
console.log('asignacion', asig.recordset);

await pool.close();
