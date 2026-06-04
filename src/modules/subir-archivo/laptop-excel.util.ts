import * as ExcelJS from 'exceljs';
import {
  LAPTOP_EXCEL_HEADERS,
  LAPTOP_EXCEL_HEADER_LABELS,
  LAPTOP_EXCEL_OPTIONAL_ALIASES,
  LaptopExcelHeader,
  buildLaptopHeaderAliasMap,
  normalizeLaptopExcelHeader,
} from './laptop-excel.constants';
import { getCellString, normalizeLookupValue } from './modem-excel.util';

export type LaptopExcelRow = Partial<
  Record<LaptopExcelHeader, string | null>
> & {
  ACTIVO?: string | null;
  ESTADO?: string | null;
  VIGENCIA?: string | null;
  OFICINA?: string | null;
  MAC?: string | null;
  IP?: string | null;
  PATRIMONIAL?: string | null;
  DONADO?: string | null;
  POSICION?: string | null;
  PASSWORD?: string | null;
  EXCEL_ID?: string | null;
};

export type ParsedLaptopExcelRow = { excelRow: number; item: LaptopExcelRow };

const ASIGNACION_ESTADO_KEYS = new Set([
  'ASIGNADO',
  'ALMACEN TI',
  'ALMACEN DE TI',
  'STOCK',
  'NO UBICADO',
  'NO ASIGNADO',
]);

const STATUS_TO_ESTADO_PC = new Map<string, string>([
  ['VIGENTE', 'OPERATIVO'],
  ['VENCIDO', 'INOPERATIVO'],
  ['INOPERATIVO', 'INOPERATIVO'],
  ['OPERATIVO', 'OPERATIVO'],
]);

const STATUS_TO_ESTADO_EQUIPO = new Set(['STOCK', 'DONADO']);

const VIGENCIA_INACTIVO = new Set([
  'BAJA',
  'DONADO',
  'NO RENOVAR',
  'RETIRAR DE PRODUCCION',
  'PARA DONAR',
]);

/** Texto de catálogo TBLM_estados_equipo a partir de STATUS del Excel. */
export function mapLaptopStatusToEstadoPcText(
  status: string | null | undefined,
): string | null {
  if (!status?.trim()) return null;
  const norm = normalizeLookupValue(status);
  return STATUS_TO_ESTADO_PC.get(norm) ?? status.trim();
}

/** Texto de catálogo TBLM_asignacion a partir de STATUS / Oficina. */
export function mapLaptopStatusToEstadoEquipoText(
  status: string | null | undefined,
): string | null {
  if (!status?.trim()) return null;
  const norm = normalizeLookupValue(status);
  if (norm === 'STOCK') return 'STOCK';
  if (norm === 'DONADO') return 'ALMACEN TI';
  if (norm === 'NO ASIGNADO') return 'NO UBICADO';
  if (ASIGNACION_ESTADO_KEYS.has(norm)) return status.trim();
  return null;
}

export function mapLaptopEstadoPcToStatusExport(
  desc: string | null | undefined,
): string {
  if (!desc?.trim()) return '';
  const norm = normalizeLookupValue(desc);
  if (norm === 'OPERATIVO') return 'VIGENTE';
  if (norm === 'INOPERATIVO') return 'VENCIDO';
  return desc.trim();
}

export function repairLaptopExcelRow(item: LaptopExcelRow): LaptopExcelRow {
  const repaired: LaptopExcelRow = { ...item };

  const statusRaw = repaired['ESTADO PC']?.trim() || repaired.ESTADO?.trim();

  if (statusRaw) {
    const norm = normalizeLookupValue(statusRaw);
    const eqText = mapLaptopStatusToEstadoEquipoText(statusRaw);
    if (eqText && !repaired['ESTADO EQUIPO']?.trim()) {
      repaired['ESTADO EQUIPO'] = eqText;
    }
    const pcText = mapLaptopStatusToEstadoPcText(statusRaw);
    if (pcText && STATUS_TO_ESTADO_PC.has(norm)) {
      repaired['ESTADO PC'] = pcText;
    } else if (!eqText && pcText) {
      repaired['ESTADO PC'] = pcText;
    }
  }

  const oficina = repaired.OFICINA?.trim();
  if (oficina && !repaired['ESTADO EQUIPO']?.trim()) {
    const eqFromOficina = mapLaptopStatusToEstadoEquipoText(oficina);
    if (eqFromOficina) {
      repaired['ESTADO EQUIPO'] = eqFromOficina;
    }
  }

  const matchAlmacen = repaired['ESTADO EQUIPO']?.trim();
  if (matchAlmacen && normalizeLookupValue(matchAlmacen) === 'MATCH ALMACEN TI') {
    repaired['ESTADO EQUIPO'] = 'ALMACEN TI';
  }

  /** laptos.xlsx columna HOST → pcs_laptops.serie */
  if (!repaired.SERIE?.trim()) {
    const hostCol = (repaired as LaptopExcelRow & { HOST?: string }).HOST?.trim();
    if (hostCol) repaired.SERIE = hostCol;
  }

  return repaired;
}

/** Valor de la columna HOST del Excel, guardado en BD como `serie`. */
export function getLaptopSerieFromExcelItem(item: LaptopExcelRow): string {
  const raw =
    item.SERIE?.trim() ||
    (item as LaptopExcelRow & { HOST?: string }).HOST?.trim() ||
    '';
  return raw.replace(/\s+/g, ' ');
}

/** Solo columna Observación del Excel → pcs_laptops.observaciones */
export function getLaptopObservacionFromExcel(
  item: LaptopExcelRow,
): string | null {
  const text = item.OBSERVACIONES?.trim();
  if (!text || text.includes('[object')) return null;
  return text.length > 255 ? text.slice(0, 252) + '...' : text;
}

export function parseLaptopActivoFromExcel(
  item: LaptopExcelRow,
  fallback: boolean,
): boolean {
  if (item.ACTIVO != null && String(item.ACTIVO).trim() !== '') {
    const v = normalizeLookupValue(String(item.ACTIVO));
    if (['SI', 'S', '1', 'TRUE', 'ACTIVO', 'VIGENTE'].includes(v)) return true;
    if (['NO', 'N', '0', 'FALSE', 'INACTIVO'].includes(v)) return false;
  }
  const vig = item.VIGENCIA?.trim();
  if (vig) {
    const norm = normalizeLookupValue(vig);
    if (VIGENCIA_INACTIVO.has(norm)) return false;
    if (['VIGENTE', 'NUEVAS'].includes(norm)) return true;
  }
  const status = item['ESTADO PC']?.trim() || item.ESTADO?.trim();
  if (status && normalizeLookupValue(status) === 'DONADO') return false;
  return fallback;
}

const LAPTOP_HEADER_SCAN_MAX_ROW = 40;

function rowLooksLikeLaptopHeader(
  row: ExcelJS.Row,
  aliasMap: Map<string, LaptopExcelHeader>,
  optionalKeys: Set<string>,
): boolean {
  const present = new Set<string>();
  let hasStatusColumn = false;

  row.eachCell({ includeEmpty: false }, (cell) => {
    const h = getCellString(cell.value);
    if (!h) return;
    const normalized = normalizeLaptopExcelHeader(h);
    const canonical = aliasMap.get(normalized);
    if (canonical) present.add(canonical);
    if (
      normalized === 'STATUS' ||
      optionalKeys.has(normalized) ||
      LAPTOP_EXCEL_OPTIONAL_ALIASES.ESTADO?.some(
        (a) => normalizeLaptopExcelHeader(a) === normalized,
      )
    ) {
      hasStatusColumn = true;
    }
  });

  const hasHostOrSerie = present.has('SERIE');
  const hasOtherKey =
    present.has('TIPO') ||
    present.has('MARCA') ||
    present.has('MODELO') ||
    present.has('ESTADO PC') ||
    hasStatusColumn;

  return hasHostOrSerie && hasOtherKey;
}

export function findLaptopHeaderRowNumber(
  worksheet: ExcelJS.Worksheet,
): number | null {
  const aliasMap = buildLaptopHeaderAliasMap();
  const optionalKeys = new Set(
    Object.keys(LAPTOP_EXCEL_OPTIONAL_ALIASES).map((k) =>
      normalizeLaptopExcelHeader(k),
    ),
  );

  let found: number | null = null;

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (found !== null || rowNumber > LAPTOP_HEADER_SCAN_MAX_ROW) return;
    if (rowLooksLikeLaptopHeader(row, aliasMap, optionalKeys)) {
      found = rowNumber;
    }
  });

  return found;
}

/** Busca hoja y fila de encabezado (laptos.xlsx: HOST, TIPO, MARCA, STATUS…). */
export function resolveLaptopExcelSource(
  workbook: ExcelJS.Workbook,
): { worksheet: ExcelJS.Worksheet; headerRowNumber: number } | null {
  let best: {
    worksheet: ExcelJS.Worksheet;
    headerRowNumber: number;
    score: number;
  } | null = null;

  for (const worksheet of workbook.worksheets) {
    const headerRowNumber = findLaptopHeaderRowNumber(worksheet);
    if (headerRowNumber === null) continue;
    const score = worksheet.rowCount - headerRowNumber;
    if (!best || score > best.score) {
      best = { worksheet, headerRowNumber, score };
    }
  }

  if (!best) return null;
  return {
    worksheet: best.worksheet,
    headerRowNumber: best.headerRowNumber,
  };
}

export function parseLaptopExcelWorksheet(
  worksheet: ExcelJS.Worksheet,
  headerRowNumber?: number,
): ParsedLaptopExcelRow[] {
  const resolvedHeader =
    headerRowNumber ?? findLaptopHeaderRowNumber(worksheet);
  if (resolvedHeader === null) {
    return [];
  }
  const headerRow = resolvedHeader;

  const aliasMap = buildLaptopHeaderAliasMap();
  const optionalMap = new Map<string, string>();
  for (const [key, aliases] of Object.entries(LAPTOP_EXCEL_OPTIONAL_ALIASES)) {
    for (const alias of aliases) {
      optionalMap.set(normalizeLaptopExcelHeader(alias), key);
    }
  }

  const colToKey = new Map<number, LaptopExcelHeader>();
  const colToOptional = new Map<number, string>();

  worksheet.getRow(headerRow).eachCell((cell, colNumber) => {
    const raw = getCellString(cell.value);
    if (!raw) return;
    const normalized = normalizeLaptopExcelHeader(raw);
    const canonical = aliasMap.get(normalized);
    if (canonical) {
      if (canonical === 'SERIE' && normalized === 'LARGO HOST') {
        return;
      }
      colToKey.set(colNumber, canonical);
      return;
    }
    const optional = optionalMap.get(normalized);
    if (optional) colToOptional.set(colNumber, optional);
  });

  const rows: ParsedLaptopExcelRow[] = [];

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber <= headerRow) return;

    const item: LaptopExcelRow = {};
    let hasData = false;

    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const key = colToKey.get(colNumber);
      const opt = colToOptional.get(colNumber);
      const value = getCellString(cell.value);
      if (!value) return;
      hasData = true;
      if (key) {
        item[key] = value;
      } else if (opt) {
        (item as LaptopExcelRow & Record<string, string | null>)[opt] = value;
      }
    });

    if (hasData) {
      rows.push({
        excelRow: rowNumber,
        item: repairLaptopExcelRow(item),
      });
    }
  });

  return rows;
}

export async function buildLaptopExcelBuffer(
  dataRows: LaptopExcelRow[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Pc  Laptops', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  const headerRow = worksheet.addRow(
    LAPTOP_EXCEL_HEADERS.map((h) => LAPTOP_EXCEL_HEADER_LABELS[h] ?? h),
  );
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1D4ED8' },
    };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
  });

  for (const row of dataRows) {
    worksheet.addRow(
      LAPTOP_EXCEL_HEADERS.map((header) => row[header] ?? ''),
    );
  }

  worksheet.columns.forEach((column, index) => {
    const header =
      LAPTOP_EXCEL_HEADER_LABELS[LAPTOP_EXCEL_HEADERS[index] ?? 'SERIE'] ?? '';
    const maxLen = Math.max(
      header.length,
      ...dataRows.map((r) => String(r[header as LaptopExcelHeader] ?? '').length),
    );
    column.width = Math.min(Math.max(maxLen + 2, 12), 40);
  });

  const output = await workbook.xlsx.writeBuffer();
  return Buffer.isBuffer(output) ? output : Buffer.from(output);
}
