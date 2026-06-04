/** Columnas del Excel de chips (mismos nombres para importar y exportar). */
export const CHIP_EXCEL_HEADERS = [
  'NUMERO',
  'ICCID',
  /** Guarda en chips.tipo_chip → TBLM_tipo_chip (VOZ, DATOS, …) */
  'USO',
  'AREA',
  'USUARIO',
  'ESTADO',
  'OPERADOR',
  'OBSERVACIONES',
  'TICKET',
] as const;

export type ChipExcelHeader = (typeof CHIP_EXCEL_HEADERS)[number];

/** Variantes de encabezado (chip.xlsx, plantilla y exportación). */
export const CHIP_HEADER_ALIASES: Record<ChipExcelHeader, string[]> = {
  NUMERO: ['NUMERO', 'NÚMERO', 'NUMERO CHIP', 'NUMERO DE CHIP'],
  ICCID: ['ICCID'],
  USO: ['USO', 'TIPO', 'TIPO CHIP'],
  AREA: ['AREA', 'ÁREA'],
  USUARIO: ['USUARIO'],
  ESTADO: ['ESTADO', 'ESTADO CHIP'],
  OPERADOR: ['OPERADOR', 'OPERADOR MOVIL', 'OPERADOR MÓVIL'],
  OBSERVACIONES: ['OBSERVACIONES', 'OBSERVACION'],
  TICKET: ['TICKET', '#TICKET', '#LOTE', 'LOTE'],
};

export const CHIP_EXCEL_OPTIONAL_ALIASES: Record<string, string[]> = {
  ACTIVO: ['ACTIVO'],
  CORREO: ['CORREO', 'CORREO ELECTRONICO', 'CORREO ELECTRÓNICO'],
};

export function buildChipHeaderAliasMap(): Map<string, ChipExcelHeader> {
  const map = new Map<string, ChipExcelHeader>();
  for (const canonical of CHIP_EXCEL_HEADERS) {
    for (const alias of CHIP_HEADER_ALIASES[canonical]) {
      map.set(normalizeChipExcelHeader(alias), canonical);
    }
  }
  return map;
}

export function normalizeChipExcelHeader(header: string): string {
  return header
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
