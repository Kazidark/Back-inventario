/**
 * Columnas canónicas tablets.xlsx → tabla `tablets`.
 * Los textos del Excel se resuelven a ID de catálogo maestro (igual que laptops/módems).
 */
export const TABLET_EXCEL_HEADERS = [
  'MARCA',
  'MODELO',
  'IMEI',
  /** Excel "ESTADO OPERATIVO" (OPERATIVO/INOPERATIVO) → tablets.estado_tablet → TBLM_estados_equipo.id_estado */
  'ESTADO TABLET',
  /** Excel "ESTADO DEL EQUIPO" (ASIGNADO/MALOGRADO/…) → tablets.estado_equipo → TBLM_asignacion.id_asignado */
  'ESTADO EQUIPO',
  /** Excel AREA → tablets.id_area → areas.id_area */
  'AREA',
  /** Vincula tablets.num_chips → chips por ICCID */
  'ICCID',
  /** Excel UBICACIÓN (o KIOSKO si UBICACIÓN vacía) → tablets.ubicacion → TBLM_ubicacion.id */
  'UBICACION',
  /** Excel Obs1 → tablets.observaciones (texto) */
  'OBSERVACIONES',
  'TICKET',
] as const;

export type TabletExcelHeader = (typeof TABLET_EXCEL_HEADERS)[number];

export const TABLET_HEADER_ALIASES: Record<TabletExcelHeader, string[]> = {
  MARCA: ['MARCA'],
  MODELO: ['MODELO'],
  IMEI: ['IMEI', 'IMEI TABLET', 'IMEI TABLET '],
  'ESTADO TABLET': [
    'ESTADO TABLET',
    'ESTADO TABLET ',
    'ESTADO DE TABLET',
    'ESTADO OPERATIVO',
    'ESTADO OPERATIVO ',
    'ESTADO CELULAR',
    'STATUS',
  ],
  'ESTADO EQUIPO': [
    'ESTADO EQUIPO',
    'ESTADO DEL EQUIPO',
    'ESTADO DEL EQUIPO ',
    'ESTADO EQUI',
    'ESTADO DE EQUIPO',
    'TIPO DE ESTADO',
    'TIPO ESTADO',
  ],
  AREA: ['AREA', 'ÁREA'],
  ICCID: ['ICCID', 'ICCID CHIP'],
  UBICACION: ['UBICACION', 'UBICACIÓN'],
  OBSERVACIONES: [
    'OBSERVACIONES',
    'OBSERVACION',
    'OBSERVACIÓN',
    'OBS1',
    'OBS 1',
  ],
  TICKET: [
    'TICKET',
    'TICKETS',
    'TIKETS',
    '#TICKET',
    '# TICKET',
    'TICKET ',
  ],
};

/** Etiquetas como en tablets.xlsx (export / plantilla). */
export const TABLET_EXCEL_HEADER_LABELS: Record<TabletExcelHeader, string> = {
  MARCA: 'MARCA',
  MODELO: 'MODELO',
  IMEI: 'IMEI',
  'ESTADO TABLET': 'ESTADO OPERATIVO',
  'ESTADO EQUIPO': 'ESTADO DEL EQUIPO',
  AREA: 'AREA',
  ICCID: 'ICCID',
  UBICACION: 'UBICACIÓN',
  OBSERVACIONES: 'Obs1',
  TICKET: '#Ticket',
};

export const TABLET_EXCEL_OPTIONAL_ALIASES: Record<string, string[]> = {
  EXCEL_ID: ['ID'],
  SERIE: ['SERIE'],
  NUMERO: ['NUMERO', 'NÚMERO', 'NUMERO CHIP'],
  OPERADOR: ['OPERADOR'],
  PROVEEDOR: ['PROVEEDOR'],
  VALIDADO: ['VALIDADO'],
  KIOSKO: ['KIOSKO'],
  KNOX: ['KNOX'],
  LARGO_IMEI: ['LARGO IMEI'],
  LARGO_ICCID: ['LARGO ICCID'],
  TAB_REPOSICION: ['# TAB_REPOSICION', '# TAB_REPOSICIÓN', 'TAB_REPOSICION'],
  CORREO: ['CORREO', 'CORREO ELECTRONICO'],
};

export function buildTabletHeaderAliasMap(): Map<string, TabletExcelHeader> {
  const map = new Map<string, TabletExcelHeader>();
  for (const canonical of TABLET_EXCEL_HEADERS) {
    for (const alias of TABLET_HEADER_ALIASES[canonical]) {
      map.set(normalizeTabletExcelHeader(alias), canonical);
    }
  }
  return map;
}

export function normalizeTabletExcelHeader(header: string): string {
  return header
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-')
    .replace(/\s+/g, ' ');
}
