import * as ExcelJS from 'exceljs';
import {
  TABLET_EXCEL_HEADERS,
  TABLET_EXCEL_HEADER_LABELS,
  TABLET_EXCEL_OPTIONAL_ALIASES,
  TabletExcelHeader,
  buildTabletHeaderAliasMap,
  normalizeTabletExcelHeader,
} from './tablet-excel.constants';
import { getCellString, normalizeLookupValue } from './modem-excel.util';

export type TabletExcelRow = Partial<
  Record<TabletExcelHeader, string | null>
> & {
  EXCEL_ID?: string | null;
  SERIE?: string | null;
  NUMERO?: string | null;
  OPERADOR?: string | null;
  PROVEEDOR?: string | null;
  VALIDADO?: string | null;
  KIOSKO?: string | null;
};

export type ParsedTabletExcelRow = { excelRow: number; item: TabletExcelRow };

const INVALID_ICCID = new Set([
  '-',
  'SIN INFORMACION',
  'SIN INFORMACIÓN',
  'N/A',
  'NA',
]);

/** Excel ESTADO OPERATIVO → texto TBLM_estados_equipo (estado_tablet). */
export function mapTabletEstadoOperativoText(
  value: string | null | undefined,
): string | null {
  if (!value?.trim()) return null;
  const norm = normalizeLookupValue(value);
  if (norm === 'VIGENTE') return 'OPERATIVO';
  if (norm === 'VENCIDO') return 'INOPERATIVO';
  if (norm === 'OPERATIVO' || norm === 'INOPERATIVO') return value.trim();
  if (norm === 'ANDROID') return 'OPERATIVO';
  return value.trim();
}

/** Excel ESTADO DEL EQUIPO → texto TBLM_asignacion (estado_equipo). */
export function mapTabletEstadoEquipoText(
  value: string | null | undefined,
): string | null {
  if (!value?.trim()) return null;
  const norm = normalizeLookupValue(value);
  if (norm === 'ALMACEN DE TI' || norm === 'MATCH ALMACEN TI') return 'ALMACEN TI';
  if (norm === 'NO ASIGNADO') return 'NO UBICADO';
  /** En tablets.xlsx a veces OPERATIVO va en columna de asignación. */
  if (norm === 'OPERATIVO') return 'ASIGNADO';
  return value.trim();
}

/** Excel UBICACIÓN / KIOSKO → texto TBLM_ubicacion (tablets.ubicacion). */
export function mapTabletUbicacionText(
  value: string | null | undefined,
): string | null {
  if (!value?.trim() || value.trim() === '-') return null;
  const norm = normalizeLookupValue(value);
  if (norm === 'SURCO') return 'SURQUILLO';
  if (norm === 'SIN INFORMACION') return null;
  return value.trim();
}

export function repairTabletExcelRow(item: TabletExcelRow): TabletExcelRow {
  const repaired: TabletExcelRow = { ...item };
  const estadoTablet = mapTabletEstadoOperativoText(repaired['ESTADO TABLET']);
  if (estadoTablet) repaired['ESTADO TABLET'] = estadoTablet;
  const estadoEquipo = mapTabletEstadoEquipoText(repaired['ESTADO EQUIPO']);
  if (estadoEquipo) repaired['ESTADO EQUIPO'] = estadoEquipo;
  const kiosko = item.KIOSKO?.trim();
  if (!repaired.UBICACION?.trim() && kiosko && kiosko !== '-') {
    repaired.UBICACION = kiosko;
  }
  const ubicacion = mapTabletUbicacionText(repaired.UBICACION);
  if (ubicacion) repaired.UBICACION = ubicacion;
  return repaired;
}

export function getTabletImeiFromExcelItem(item: TabletExcelRow): string {
  return (item.IMEI?.trim() ?? '').replace(/\s+/g, ' ');
}

export function getTabletObservacionFromExcel(
  item: TabletExcelRow,
): string | null {
  const text = item.OBSERVACIONES?.trim();
  if (!text || text.includes('[object')) return null;
  return text.length > 255 ? text.slice(0, 252) + '...' : text;
}

export function isTabletIccidLinkable(iccid: string | null | undefined): boolean {
  if (!iccid?.trim()) return false;
  const norm = iccid.trim().toUpperCase();
  return !INVALID_ICCID.has(norm);
}

export function parseTabletActivoFromExcel(
  item: TabletExcelRow,
  fallback: boolean,
): boolean {
  const v = item.VALIDADO?.trim();
  if (!v) return fallback;
  const norm = v.toUpperCase();
  if (['VALIDADO', 'SI', 'S', '1', 'TRUE'].includes(norm)) return true;
  if (['NO', 'N', '0', 'FALSE'].includes(norm)) return false;
  return fallback;
}

const TABLET_HEADER_SCAN_MAX_ROW = 60;

function rowLooksLikeTabletHeader(
  row: ExcelJS.Row,
  aliasMap: Map<string, TabletExcelHeader>,
): boolean {
  const present = new Set<string>();
  row.eachCell({ includeEmpty: false }, (cell) => {
    const h = getCellString(cell.value);
    if (!h) return;
    const canonical = aliasMap.get(normalizeTabletExcelHeader(h));
    if (canonical) present.add(canonical);
  });
  return present.has('IMEI') && (present.has('MARCA') || present.has('MODELO'));
}

export function findTabletHeaderRowNumber(
  worksheet: ExcelJS.Worksheet,
): number | null {
  const aliasMap = buildTabletHeaderAliasMap();
  let found: number | null = null;

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (found !== null || rowNumber > TABLET_HEADER_SCAN_MAX_ROW) return;
    if (rowLooksLikeTabletHeader(row, aliasMap)) {
      found = rowNumber;
    }
  });

  return found;
}

export function resolveTabletExcelSource(
  workbook: ExcelJS.Workbook,
): { worksheet: ExcelJS.Worksheet; headerRowNumber: number } | null {
  let best: {
    worksheet: ExcelJS.Worksheet;
    headerRowNumber: number;
    score: number;
  } | null = null;

  for (const worksheet of workbook.worksheets) {
    const headerRowNumber = findTabletHeaderRowNumber(worksheet);
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

export function parseTabletExcelWorksheet(
  worksheet: ExcelJS.Worksheet,
  headerRowNumber?: number,
): ParsedTabletExcelRow[] {
  const resolvedHeader =
    headerRowNumber ?? findTabletHeaderRowNumber(worksheet);
  if (resolvedHeader === null) return [];

  const aliasMap = buildTabletHeaderAliasMap();
  const optionalMap = new Map<string, string>();
  for (const [key, aliases] of Object.entries(TABLET_EXCEL_OPTIONAL_ALIASES)) {
    for (const alias of aliases) {
      optionalMap.set(normalizeTabletExcelHeader(alias), key);
    }
  }

  const colToKey = new Map<number, TabletExcelHeader>();
  const colToOptional = new Map<number, string>();

  worksheet.getRow(resolvedHeader).eachCell((cell, colNumber) => {
    const raw = getCellString(cell.value);
    if (!raw) return;
    const normalized = normalizeTabletExcelHeader(raw);
    const canonical = aliasMap.get(normalized);
    if (canonical) {
      if (
        canonical === 'IMEI' &&
        (normalized === 'LARGO IMEI' || normalized === 'LARGO ICCID')
      ) {
        return;
      }
      colToKey.set(colNumber, canonical);
      return;
    }
    const optional = optionalMap.get(normalized);
    if (optional) colToOptional.set(colNumber, optional);
  });

  const rows: ParsedTabletExcelRow[] = [];

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber <= resolvedHeader) return;

    const item: TabletExcelRow = {};
    let hasData = false;

    const fkColumns = new Set<TabletExcelHeader>([
      'ESTADO TABLET',
      'ESTADO EQUIPO',
      'UBICACION',
      'OBSERVACIONES',
    ]);

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const key = colToKey.get(colNumber);
      const opt = colToOptional.get(colNumber);
      const value = getCellString(cell.value);
      if (!value) return;
      hasData = true;
      if (key) {
        if (!item[key] || fkColumns.has(key)) {
          item[key] = value;
        }
      } else if (opt) {
        const rowExt = item as TabletExcelRow & Record<string, string | null>;
        if (!rowExt[opt]) rowExt[opt] = value;
      }
    });

    if (hasData) {
      rows.push({
        excelRow: rowNumber,
        item: repairTabletExcelRow(item),
      });
    }
  });

  return rows;
}

export async function buildTabletExcelBuffer(
  dataRows: TabletExcelRow[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Tablets', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  const headerRow = worksheet.addRow(
    TABLET_EXCEL_HEADERS.map((h) => TABLET_EXCEL_HEADER_LABELS[h] ?? h),
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
      TABLET_EXCEL_HEADERS.map((header) => row[header] ?? ''),
    );
  }

  worksheet.columns.forEach((column, index) => {
    const header =
      TABLET_EXCEL_HEADER_LABELS[TABLET_EXCEL_HEADERS[index] ?? 'IMEI'] ?? '';
    const maxLen = Math.max(
      header.length,
      ...dataRows.map((r) => String(r[header as TabletExcelHeader] ?? '').length),
    );
    column.width = Math.min(Math.max(maxLen + 2, 12), 45);
  });

  const output = await workbook.xlsx.writeBuffer();
  return Buffer.isBuffer(output) ? output : Buffer.from(output);
}
