import * as ExcelJS from 'exceljs';
import {
  MODEM_EXCEL_HEADERS,
  MODEM_EXCEL_OPTIONAL_ALIASES,
  ModemExcelHeader,
  buildModemHeaderAliasMap,
  normalizeModemExcelHeader,
} from './modem-excel.constants';

export type ModemExcelRow = Partial<
  Record<ModemExcelHeader, string | null>
> & {
  ACTIVO?: string | null;
  ICCID?: string | null;
  OPERADOR?: string | null;
  'CODIGO CHIP'?: string | null;
};

export function getCellString(
  value: ExcelJS.CellValue | null | undefined,
): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') {
    const hyperlinkCell = value as unknown as Partial<ExcelJS.CellHyperlinkValue>;
    if (
      hyperlinkCell?.hyperlink !== undefined &&
      typeof hyperlinkCell.text === 'string'
    ) {
      const t = hyperlinkCell.text.trim();
      return t || null;
    }
    if ('result' in value && value.result !== undefined && value.result !== null) {
      const result = value.result as unknown;
      if (typeof result === 'object' && result !== null && 'error' in result) {
        return null;
      }
      const text = String(result).trim();
      if (!text || text === '[object Object]') return null;
      return text;
    }
    if ('text' in value && value.text !== undefined) {
      return String(value.text).trim() || null;
    }
    if ('richText' in value && Array.isArray(value.richText)) {
      const text = value.richText.map((part) => part.text).join('').trim();
      return text || null;
    }
    return null;
  }
  const text = String(value).trim();
  return text === '' ? null : text;
}

export function normalizeLookupValue(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

/** Normaliza para comparar catálogos: ignora DE/DEL y espacios extra (ALMACEN DE TI ≈ ALMACEN TI). */
export function normalizeCatalogKey(value: string): string {
  return normalizeLookupValue(value)
    .replace(/\b(DE|DEL|LA|EL|LOS|LAS)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Busca en catálogo maestro por texto (exacto, clave normalizada y parcial).
 * Usado para estado_equipo (TBLM_asignacion), áreas, estados operativos, etc.
 */
export function findMasterCatalogMatch<T>(
  value: string | null | undefined,
  catalog: T[],
  getLabel: (item: T) => string,
): T | null {
  if (value == null || !String(value).trim()) return null;
  const target = normalizeLookupValue(String(value));
  const targetKey = normalizeCatalogKey(String(value));
  if (!target) return null;

  const exact = catalog.find(
    (item) => normalizeLookupValue(getLabel(item)) === target,
  );
  if (exact) return exact;

  const keyMatch = catalog.find(
    (item) => normalizeCatalogKey(getLabel(item)) === targetKey,
  );
  if (keyMatch) return keyMatch;

  return (
    catalog.find((item) => {
      const label = normalizeLookupValue(getLabel(item));
      const labelKey = normalizeCatalogKey(getLabel(item));
      return (
        label.includes(target) ||
        target.includes(label) ||
        labelKey.includes(targetKey) ||
        targetKey.includes(labelKey)
      );
    }) ?? null
  );
}

export function parseNumericId(value: string | null | undefined): number | null {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  return null;
}

export function findModemHeaderRowNumber(
  worksheet: ExcelJS.Worksheet,
): number | null {
  const aliasMap = buildModemHeaderAliasMap();
  let found: number | null = null;

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (found !== null) return;
    const present = new Set<string>();
    row.eachCell({ includeEmpty: false }, (cell) => {
      const h = getCellString(cell.value);
      if (!h) return;
      const canonical = aliasMap.get(normalizeModemExcelHeader(h));
      if (canonical) present.add(canonical);
    });
    if (
      present.has('IMEI') &&
      (present.has('MARCA') || present.has('MODELO') || present.has('ESTADO OPERATIVO'))
    ) {
      found = rowNumber;
    }
  });

  return found;
}

export type ParsedModemExcelRow = { excelRow: number; item: ModemExcelRow };

export function parseModemExcelWorksheet(
  worksheet: ExcelJS.Worksheet,
): ParsedModemExcelRow[] {
  const headerRowNumber = findModemHeaderRowNumber(worksheet);
  if (headerRowNumber === null) {
    return [];
  }

  const aliasMap = buildModemHeaderAliasMap();
  const optionalMap = new Map<string, string>();
  for (const [key, aliases] of Object.entries(MODEM_EXCEL_OPTIONAL_ALIASES)) {
    for (const alias of aliases) {
      optionalMap.set(normalizeModemExcelHeader(alias), key);
    }
  }
  const colToKey = new Map<number, ModemExcelHeader>();
  const colToOptional = new Map<number, string>();

  worksheet.getRow(headerRowNumber).eachCell((cell, colNumber) => {
    const raw = getCellString(cell.value);
    if (!raw) return;
    const normalized = normalizeModemExcelHeader(raw);
    const canonical = aliasMap.get(normalized);
    if (canonical) {
      colToKey.set(colNumber, canonical);
      return;
    }
    const optional = optionalMap.get(normalized);
    if (optional) colToOptional.set(colNumber, optional);
  });

  const rows: ParsedModemExcelRow[] = [];

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber <= headerRowNumber) return;

    const item: ModemExcelRow = {};
    let hasData = false;

    row.eachCell((cell, colNumber) => {
      const key = colToKey.get(colNumber);
      const optionalKey = colToOptional.get(colNumber);
      const value = getCellString(cell.value);
      if (key) {
        const prev = item[key];
        const prevText = prev == null ? '' : String(prev).trim();
        const nextText = value == null ? '' : String(value).trim();
        if (nextText) {
          item[key] = value;
          hasData = true;
        } else if (!prevText) {
          item[key] = value;
        }
      } else if (optionalKey) {
        item[optionalKey as keyof ModemExcelRow] = value;
        if (value) hasData = true;
      }
    });

    if (hasData) rows.push({ excelRow: rowNumber, item });
  });

  return rows;
}

export async function buildModemExcelBuffer(
  dataRows: ModemExcelRow[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Modems', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  const headerRow = worksheet.addRow([...MODEM_EXCEL_HEADERS]);
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF047857' },
    };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });

  for (const row of dataRows) {
    worksheet.addRow(
      MODEM_EXCEL_HEADERS.map((header) => row[header] ?? ''),
    );
  }

  worksheet.columns.forEach((column, index) => {
    const header = MODEM_EXCEL_HEADERS[index] ?? '';
    const maxLen = Math.max(
      header.length,
      ...dataRows.map((r) => String(r[header as ModemExcelHeader] ?? '').length),
    );
    column.width = Math.min(Math.max(maxLen + 2, 12), 40);
  });

  const output = await workbook.xlsx.writeBuffer();
  return Buffer.isBuffer(output) ? output : Buffer.from(output);
}
