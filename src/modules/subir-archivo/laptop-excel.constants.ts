/** Columnas del Excel de PCs/laptops (mismos nombres para importar y exportar). */

export const LAPTOP_EXCEL_HEADERS = [

  'TIPO',

  'MARCA',

  'MODELO',

  'SERIE',

  /** TBLM_estados_equipo (OPERATIVO, INOPERATIVO) — en laptos.xlsx: STATUS */

  'ESTADO PC',

  /** TBLM_asignacion (ASIGNADO, ALMACEN TI, STOCK, …) */

  'ESTADO EQUIPO',

  'AREA',

  'USUARIO',

  'TICKET',

  /** TBLM_ubicacion — en laptos.xlsx: Ubicación */

  'UBICACION',

  'OBSERVACIONES',

  'ANEXO',

] as const;



export type LaptopExcelHeader = (typeof LAPTOP_EXCEL_HEADERS)[number];



export const LAPTOP_HEADER_ALIASES: Record<LaptopExcelHeader, string[]> = {

  TIPO: [

    'TIPO',

    'TIPO EQUIPO',

    'TIPO DE EQUIPO',

    'TIPO_EQUIPO',

    'TIPO DE EQUIPO PC',

  ],

  MARCA: ['MARCA'],

  MODELO: ['MODELO', 'MODELO EQUIPO'],

  /** laptos.xlsx usa HOST como identificador único (serie/host) */

  SERIE: [

    'SERIE',

    'HOST',

    'N SERIE',

    'N° SERIE',

    'NO SERIE',

    'NUMERO DE SERIE',

  ],

  'ESTADO PC': [

    'ESTADO PC',

    'ESTADO_PC',

    'ESTADO PC/LAPTOP',

    'ESTADO DEL PC',

    'ESTADO PC LAPTOP',

    'STATUS',

  ],

  'ESTADO EQUIPO': [

    'ESTADO EQUIPO',

    'ESTADO_EQUIPO',

    'ESTADO DE EQUIPO',

    'ESTADO DEL EQUIPO',

    'MATCH ALMACEN TI',

  ],

  AREA: ['AREA', 'ÁREA'],

  /** Solo USUARIO del Excel (col. H); no confundir con columna "User" (login). */
  USUARIO: ['USUARIO', 'COLABORADOR'],

  TICKET: ['TICKET', 'TICKETS', 'TIKETS', 'TIKET', '#TICKET'],

  UBICACION: [

    'UBICACION',

    'UBICACIÓN',

    'UBICACION FISICA',

    'UBICACION FISICA',

  ],

  OBSERVACIONES: [

    'OBSERVACIONES',

    'OBSERVACION',

    'OBSERVACIONES2',

    'OBSERVACIÓN',

  ],

  ANEXO: ['ANEXO', 'ANEXO TELEFONO', 'ANEXO TEL'],

};



/** Encabezados como en laptos.xlsx (exportación / plantilla). */

export const LAPTOP_EXCEL_HEADER_LABELS: Record<LaptopExcelHeader, string> = {

  TIPO: 'TIPO',

  MARCA: 'MARCA',

  MODELO: 'Modelo',

  SERIE: 'HOST',

  'ESTADO PC': 'STATUS',

  'ESTADO EQUIPO': 'MATCH ALMACEN TI',

  AREA: 'AREA',

  USUARIO: 'USUARIO',

  TICKET: 'TICKET',

  UBICACION: 'Ubicación',

  OBSERVACIONES: 'Observación',

  ANEXO: 'Anexo',

};



/** Columnas extra de laptos.xlsx (no tienen columna propia en BD). */

export const LAPTOP_EXCEL_OPTIONAL_ALIASES: Record<string, string[]> = {

  ACTIVO: ['ACTIVO', 'VALIDADO'],

  ESTADO: ['ESTADO'],

  VIGENCIA: ['VIGENCIA'],

  OFICINA: ['OFICINA', 'OFICINA '],

  MAC: ['MAC'],

  IP: ['IP'],

  PATRIMONIAL: ['PATRIMONIAL'],

  DONADO: ['DONADO'],

  POSICION: ['POSICION', 'POSICIÓN'],

  PASSWORD: ['PASSWORD', 'CONTRASEÑA', 'CONTRASENA'],

  /** ID del Excel (solo respaldo si falta HOST) */
  EXCEL_ID: ['ID'],
};



export function buildLaptopHeaderAliasMap(): Map<string, LaptopExcelHeader> {

  const map = new Map<string, LaptopExcelHeader>();

  for (const canonical of LAPTOP_EXCEL_HEADERS) {

    for (const alias of LAPTOP_HEADER_ALIASES[canonical]) {

      map.set(normalizeLaptopExcelHeader(alias), canonical);

    }

  }

  return map;

}



export function normalizeLaptopExcelHeader(header: string): string {

  return header

    .trim()

    .toUpperCase()

    .normalize('NFD')

    .replace(/[\u0300-\u036f]/g, '')

    .replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-')

    .replace(/\s+/g, ' ');

}


