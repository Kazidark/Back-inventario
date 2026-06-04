import * as ExcelJS from 'exceljs';
import {
  CHIP_EXCEL_HEADERS,
  CHIP_EXCEL_OPTIONAL_ALIASES,
  ChipExcelHeader,
  buildChipHeaderAliasMap,
  normalizeChipExcelHeader,
} from './chip-excel.constants';
import { getCellString, normalizeLookupValue } from './modem-excel.util';

const KNOWN_CHIP_OPERADORES = new Set([
  'MOVISTAR',
  'CLARO',
  'ENTEL',
  'VITEL',
]);

/**
 * Corrige filas mal importadas (columna Operador → observacion, texto de lote en observacion).
 */
export function repairChipExcelRow(item: ChipExcelRow): ChipExcelRow {
  const repaired: ChipExcelRow = { ...item };
  const op = repaired.OPERADOR?.trim() ?? '';
  let obs = repaired.OBSERVACIONES?.trim() ?? '';
  let ticket = repaired.TICKET?.trim() ?? '';

  const obsNorm = obs ? normalizeLookupValue(obs) : '';

  if (!op && obs && KNOWN_CHIP_OPERADORES.has(obsNorm)) {
    repaired.OPERADOR = obs;
    repaired.OBSERVACIONES = null;
    obs = '';
  }

  if (
    op &&
    obs &&
    normalizeLookupValue(op) === obsNorm &&
    KNOWN_CHIP_OPERADORES.has(obsNorm)
  ) {
    repaired.OBSERVACIONES = null;
  }

  return repaired;
}

export type ChipExcelRow = Partial<Record<ChipExcelHeader, string | null>> & {
  ACTIVO?: string | null;
  CORREO?: string | null;
};

export type ParsedChipExcelRow = { excelRow: number; item: ChipExcelRow };

export function findChipHeaderRowNumber(
  worksheet: ExcelJS.Worksheet,
): number | null {
  const aliasMap = buildChipHeaderAliasMap();
  let found: number | null = null;

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (found !== null) return;
    const present = new Set<string>();
    row.eachCell({ includeEmpty: false }, (cell) => {
      const h = getCellString(cell.value);
      if (!h) return;
      const canonical = aliasMap.get(normalizeChipExcelHeader(h));
      if (canonical) present.add(canonical);
    });
    if (
      present.has('NUMERO') &&
      (present.has('ICCID') ||
        present.has('ESTADO') ||
        present.has('OPERADOR'))
    ) {
      found = rowNumber;
    }
  });

  return found;
}

export function parseChipExcelWorksheet(
  worksheet: ExcelJS.Worksheet,
): ParsedChipExcelRow[] {
  const headerRowNumber = findChipHeaderRowNumber(worksheet);
  if (headerRowNumber === null) {
    return [];
  }

  const aliasMap = buildChipHeaderAliasMap();
  const optionalMap = new Map<string, string>();
  for (const [key, aliases] of Object.entries(CHIP_EXCEL_OPTIONAL_ALIASES)) {
    for (const alias of aliases) {
      optionalMap.set(normalizeChipExcelHeader(alias), key);
    }
  }

  const colToKey = new Map<number, ChipExcelHeader>();
  const colToOptional = new Map<number, string>();

  worksheet.getRow(headerRowNumber).eachCell((cell, colNumber) => {
    const raw = getCellString(cell.value);
    if (!raw) return;
    const normalized = normalizeChipExcelHeader(raw);
    const canonical = aliasMap.get(normalized);
    if (canonical) {
      colToKey.set(colNumber, canonical);
      return;
    }
    const optional = optionalMap.get(normalized);
    if (optional) colToOptional.set(colNumber, optional);
  });

  const rows: ParsedChipExcelRow[] = [];

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber <= headerRowNumber) return;

    const item: ChipExcelRow = {};
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
        item[optionalKey as keyof ChipExcelRow] = value;
        if (value) hasData = true;
      }
    });

    if (hasData) rows.push({ excelRow: rowNumber, item });
  });

  return rows;
}

export async function buildChipExcelBuffer(
  dataRows: ChipExcelRow[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Chips', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  const headerRow = worksheet.addRow([...CHIP_EXCEL_HEADERS]);
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
      CHIP_EXCEL_HEADERS.map((header) => row[header] ?? ''),
    );
  }

  worksheet.columns.forEach((column, index) => {
    const header = CHIP_EXCEL_HEADERS[index] ?? '';
    const maxLen = Math.max(
      header.length,
      ...dataRows.map((r) => String(r[header as ChipExcelHeader] ?? '').length),
    );
    column.width = Math.min(Math.max(maxLen + 2, 12), 40);
  });

  const output = await workbook.xlsx.writeBuffer();
  return Buffer.isBuffer(output) ? output : Buffer.from(output);
}
