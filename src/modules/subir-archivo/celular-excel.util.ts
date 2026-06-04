import * as ExcelJS from 'exceljs';
import {
  CELULAR_EXCEL_HEADERS,
  CELULAR_EXCEL_HEADER_LABELS,
  CELULAR_EXCEL_OPTIONAL_ALIASES,
  CelularExcelHeader,
  buildCelularHeaderAliasMap,
  normalizeCelularExcelHeader,
} from './celular-excel.constants';
import { getCellString, normalizeLookupValue } from './modem-excel.util';

export type CelularExcelRow = Partial<
  Record<CelularExcelHeader, string | null>
> & {
  ACTIVO?: string | null;
  ESTADO?: string | null;
  OPERADOR?: string | null;
  SERIE?: string | null;
};

export type ParsedCelularExcelRow = { excelRow: number; item: CelularExcelRow };

const ASIGNACION_ESTADO_KEYS = new Set([
  'ASIGNADO',
  'ALMACEN TI',
  'ALMACEN DE TI',
  'STOCK',
  'NO UBICADO',
]);

/** Repara filas del Excel legacy (estado equipo en OBSERVACIONES, etc.). */
export function repairCelularExcelRow(item: CelularExcelRow): CelularExcelRow {
  const repaired: CelularExcelRow = { ...item };

  const legacyMarca = (item as CelularExcelRow & { 'EQUIPO-MARCA'?: string | null })[
    'EQUIPO-MARCA'
  ]?.trim();
  const legacyModelo = (item as CelularExcelRow & { 'EQUIPO-MODELO'?: string | null })[
    'EQUIPO-MODELO'
  ]?.trim();
  if (!repaired.MARCA?.trim() && legacyMarca) {
    repaired.MARCA = legacyMarca;
  }
  if (!repaired.MODELO?.trim() && legacyModelo) {
    repaired.MODELO = legacyModelo;
  }
  // La columna OBSERVACION/OBSERVACIONES se guarda en BD tal cual (no mover a estado equipo).

  const estadoCombo = repaired.ESTADO?.trim();
  if (estadoCombo && !repaired['ESTADO CELULAR']?.trim()) {
    const norm = normalizeLookupValue(estadoCombo);
    if (norm === 'OPERATIVO' || norm === 'INOPERATIVO') {
      repaired['ESTADO CELULAR'] = estadoCombo;
    } else if (ASIGNACION_ESTADO_KEYS.has(norm)) {
      repaired['ESTADO EQUIPO'] = estadoCombo;
    }
  }

  return repaired;
}

export function findCelularHeaderRowNumber(
  worksheet: ExcelJS.Worksheet,
): number | null {
  const aliasMap = buildCelularHeaderAliasMap();
  let found: number | null = null;

  const estadoAliases = CELULAR_EXCEL_OPTIONAL_ALIASES.ESTADO ?? [];

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (found !== null) return;
    const present = new Set<string>();
    let hasEstadoColumn = false;
    row.eachCell({ includeEmpty: false }, (cell) => {
      const h = getCellString(cell.value);
      if (!h) return;
      const normalized = normalizeCelularExcelHeader(h);
      const canonical = aliasMap.get(normalized);
      if (canonical) present.add(canonical);
      if (
        estadoAliases.some(
          (a) => normalizeCelularExcelHeader(a) === normalized,
        )
      ) {
        hasEstadoColumn = true;
      }
    });
    if (
      present.has('IMEI') &&
      (present.has('MARCA') || present.has('MODELO') || hasEstadoColumn)
    ) {
      found = rowNumber;
    }
  });

  return found;
}

export function parseCelularExcelWorksheet(
  worksheet: ExcelJS.Worksheet,
): ParsedCelularExcelRow[] {
  const headerRowNumber = findCelularHeaderRowNumber(worksheet);
  if (headerRowNumber === null) {
    return [];
  }

  const aliasMap = buildCelularHeaderAliasMap();
  const optionalMap = new Map<string, string>();
  for (const [key, aliases] of Object.entries(CELULAR_EXCEL_OPTIONAL_ALIASES)) {
    for (const alias of aliases) {
      optionalMap.set(normalizeCelularExcelHeader(alias), key);
    }
  }

  const colToKey = new Map<number, CelularExcelHeader>();
  const colToOptional = new Map<number, string>();

  worksheet.getRow(headerRowNumber).eachCell((cell, colNumber) => {
    const raw = getCellString(cell.value);
    if (!raw) return;
    const normalized = normalizeCelularExcelHeader(raw);
    const canonical = aliasMap.get(normalized);
    if (canonical) {
      colToKey.set(colNumber, canonical);
      return;
    }
    const optional = optionalMap.get(normalized);
    if (optional) colToOptional.set(colNumber, optional);
  });

  const rows: ParsedCelularExcelRow[] = [];

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber <= headerRowNumber) return;

    const item: CelularExcelRow = {};
    let hasData = false;

    row.eachCell((cell, colNumber) => {
      const key = colToKey.get(colNumber);
      const optionalKey = colToOptional.get(colNumber);
      const value = getCellString(cell.value);
      if (key) {
        const prevText =
          item[key] == null ? '' : String(item[key]).trim();
        const nextText = value == null ? '' : String(value).trim();
        if (nextText) {
          item[key] = value;
          hasData = true;
        } else if (!prevText) {
          item[key] = value;
        }
      } else if (optionalKey) {
        item[optionalKey as keyof CelularExcelRow] = value;
        if (optionalKey === 'EQUIPO-MARCA' && value?.trim()) {
          item.MARCA = item.MARCA?.trim() ? item.MARCA : value;
        }
        if (optionalKey === 'EQUIPO-MODELO' && value?.trim()) {
          item.MODELO = item.MODELO?.trim() ? item.MODELO : value;
        }
        if (value) hasData = true;
      }
    });

    if (hasData) {
      rows.push({
        excelRow: rowNumber,
        item: repairCelularExcelRow(item),
      });
    }
  });

  return rows;
}

export async function buildCelularExcelBuffer(
  dataRows: CelularExcelRow[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Celulares', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  const headerRow = worksheet.addRow(
    CELULAR_EXCEL_HEADERS.map((h) => CELULAR_EXCEL_HEADER_LABELS[h] ?? h),
  );
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF047857' },
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
      CELULAR_EXCEL_HEADERS.map((header) => row[header] ?? ''),
    );
  }

  worksheet.columns.forEach((column, index) => {
    const header = CELULAR_EXCEL_HEADER_LABELS[CELULAR_EXCEL_HEADERS[index] ?? 'MARCA'] ?? '';
    const maxLen = Math.max(
      header.length,
      ...dataRows.map((r) => String(r[header as CelularExcelHeader] ?? '').length),
    );
    column.width = Math.min(Math.max(maxLen + 2, 12), 40);
  });

  const output = await workbook.xlsx.writeBuffer();
  return Buffer.isBuffer(output) ? output : Buffer.from(output);
}
