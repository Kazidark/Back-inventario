/** Columnas del Excel de módems (mismos nombres para importar y exportar). */
export const MODEM_EXCEL_HEADERS = [
  'MARCA',
  'MODELO',
  'IMEI',
  'ESTADO OPERATIVO',
  /** Guarda en modems.estado_equipo → TBLM_asignacion.id_asignado (ASIGNADO, ALMACEN TI, STOCK, …) */
  'ESTADO DEL EQUIPO',
  'AREA',
  'USUARIO',
  'NUMERO CHIP',
  'TICKET',
] as const;

export type ModemExcelHeader = (typeof MODEM_EXCEL_HEADERS)[number];

/** Variantes de encabezado (plantillas, modem.xlsx y exportación legacy). */
export const MODEM_HEADER_ALIASES: Record<ModemExcelHeader, string[]> = {
  MARCA: ['MARCA'],
  MODELO: ['MODELO'],
  IMEI: ['IMEI'],
  'ESTADO OPERATIVO': ['ESTADO OPERATIVO', 'ESTADO MODEM'],
  'ESTADO DEL EQUIPO': [
    'ESTADO DEL EQUIPO',
    'ESTADO DE EQUIPO',
    'ESTASO DE EQUIPO',
    'ESTADO EQUIPO',
  ],
  AREA: ['AREA', 'UBICACION', 'UBICACIÓN'],
  USUARIO: ['USUARIO'],
  'NUMERO CHIP': ['NUMERO CHIP', 'NUMERO DE CHIP', 'CHIP'],
  TICKET: ['TICKET'],
};

/** Columnas extra del Excel de módems (no van en plantilla mínima). */
export const MODEM_EXCEL_OPTIONAL_ALIASES: Record<string, string[]> = {
  ACTIVO: ['ACTIVO'],
  ICCID: ['ICCID'],
  OPERADOR: ['OPERADOR', 'OPERADOR MOVIL', 'OPERADOR MÓVIL'],
  /** Código interno; no reemplaza NUMERO CHIP (columna distinta en modem.xlsx). */
  'CODIGO CHIP': ['CODIGO CHIP', 'CÓDIGO CHIP'],
};

export function buildModemHeaderAliasMap(): Map<string, ModemExcelHeader> {
  const map = new Map<string, ModemExcelHeader>();
  for (const canonical of MODEM_EXCEL_HEADERS) {
    for (const alias of MODEM_HEADER_ALIASES[canonical]) {
      map.set(normalizeModemExcelHeader(alias), canonical);
    }
  }
  return map;
}

export function normalizeModemExcelHeader(header: string): string {
  return header
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
