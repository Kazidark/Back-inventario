/** Columnas del Excel de celulares (mismos nombres para importar y exportar). */
export const CELULAR_EXCEL_HEADERS = [
  'MARCA',
  'MODELO',
  'IMEI',
  /** TBLM_estados_equipo (OPERATIVO, INOPERATIVO) */
  'ESTADO CELULAR',
  /** TBLM_asignacion (ASIGNADO, ALMACEN TI, …) */
  'ESTADO EQUIPO',
  'AREA',
  'USUARIO',
  /** Vincula celulares.numero_chip → chips por ICCID */
  'ICCID',
  'OBSERVACIONES',
  'TICKET',
  'EMAIL',
] as const;

export type CelularExcelHeader = (typeof CELULAR_EXCEL_HEADERS)[number];

export const CELULAR_HEADER_ALIASES: Record<CelularExcelHeader, string[]> = {
  MARCA: [
    'MARCA',
    'EQUIPO-MARCA',
    'EQUIPO MARCA',
    'EQUIPO_MARCA',
    'EQUIPOMARCA',
    'EQIPO-MARCA',
    'EQIPO MARCA',
  ],
  MODELO: [
    'MODELO',
    'EQUIPO-MODELO',
    'EQUIPO MODELO',
    'EQUIPO_MODELO',
    'EQUIPOMODELO',
    'EQIPO-MODELO',
    'EQIPO MODELO',
  ],
  IMEI: ['IMEI', 'IMEI CELULAR'],
  'ESTADO CELULAR': ['ESTADO CELULAR', 'ESTADO CEL', 'STATUS'],
  'ESTADO EQUIPO': ['ESTADO EQUIPO', 'ESTADO DE EQUIPO', 'ESTADO DEL EQUIPO'],
  AREA: ['AREA', 'ÁREA'],
  USUARIO: ['USUARIO'],
  ICCID: ['ICCID'],
  OBSERVACIONES: ['OBSERVACIONES', 'OBSERVACION', 'OBSERVACIONES2'],
  /** Solo columna tikets del Excel; #LOTE no es ticket */
  TICKET: ['TICKET', 'TICKETS', 'TIKETS', 'TIKET', '#TICKET'],
  EMAIL: [
    'EMAIL',
    'CORREO',
    'CORREO ELECTRONICO',
    'CORREO ELECTRÓNICO',
    'CORREO ELECTRONICO2',
  ],
};

/** Texto de encabezado en Excel exportado (mismo nombre que celulares.xlsx). */
export const CELULAR_EXCEL_HEADER_LABELS: Record<CelularExcelHeader, string> = {
  MARCA: 'EQUIPO-MARCA',
  MODELO: 'EQUIPO-MODELO',
  IMEI: 'IMEI',
  'ESTADO CELULAR': 'ESTADO CELULAR',
  'ESTADO EQUIPO': 'ESTADO EQUIPO',
  AREA: 'Area',
  USUARIO: 'Usuario',
  ICCID: 'ICCID',
  OBSERVACIONES: 'OBSERVACION',
  TICKET: 'tikets',
  EMAIL: 'correo electronico',
};

/** Columnas extra del Excel celulares.xlsx (no van en plantilla mínima). */
export const CELULAR_EXCEL_OPTIONAL_ALIASES: Record<string, string[]> = {
  ACTIVO: ['ACTIVO'],
  /** Columna única del Excel: se resuelve a estado celular o estado equipo */
  ESTADO: ['ESTADO'],
  OPERADOR: ['OPERADOR', 'OPERADOR MOVIL', 'OPERADOR MÓVIL'],
  SERIE: ['SERIE'],
  /** No se guarda en BD; solo referencia en el Excel */
  LOTE: ['#LOTE', 'LOTE', '#LOTE '],
  /** Respaldo si el encabezado no matchea alias canónico */
  'EQUIPO-MARCA': ['EQUIPO-MARCA', 'EQUIPO MARCA', 'EQUIPO_MARCA'],
  'EQUIPO-MODELO': ['EQUIPO-MODELO', 'EQUIPO MODELO', 'EQUIPO_MODELO'],
};

export function buildCelularHeaderAliasMap(): Map<string, CelularExcelHeader> {
  const map = new Map<string, CelularExcelHeader>();
  for (const canonical of CELULAR_EXCEL_HEADERS) {
    for (const alias of CELULAR_HEADER_ALIASES[canonical]) {
      map.set(normalizeCelularExcelHeader(alias), canonical);
    }
  }
  return map;
}

export function normalizeCelularExcelHeader(header: string): string {
  return header
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-')
    .replace(/\s+/g, ' ');
}
