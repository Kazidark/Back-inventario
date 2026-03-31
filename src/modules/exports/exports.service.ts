import { BadRequestException, Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { ModuleModemsService } from '../module-modems/module-modems.service';
import { ModuleChipsService } from '../module-chips/module-chips.service';
import { ModuleCelularesService } from '../module-celulares/module-celulares.service';
import { LaptosService } from '../module-pc/laptos/laptos.service';
import { ModuleMonitoresService } from '../module-monitores/module-monitores.service';
import { ModuleTabletService } from '../module-tablet/module-tablet.service';

export const EXPORT_MODULE_KEYS = [
  'modems',
  'chips',
  'celulares',
  'laptos',
  'monitores',
  'tablets',
] as const;

export type ExportModuleKey = (typeof EXPORT_MODULE_KEYS)[number];

type ExportColumn<T = Record<string, unknown>> = {
  header: string;
  accessor: (item: T) => unknown;
};

type ExportBuildResult = {
  fileName: string;
  buffer: Buffer;
};

type ModuleExportConfig = {
  title: string;
  sheetName: string;
  columns: ExportColumn[];
  rows: Record<string, unknown>[];
};

@Injectable()
export class ExportsService {
  constructor(
    private readonly moduleModemsService: ModuleModemsService,
    private readonly moduleChipsService: ModuleChipsService,
    private readonly moduleCelularesService: ModuleCelularesService,
    private readonly laptosService: LaptosService,
    private readonly moduleMonitoresService: ModuleMonitoresService,
    private readonly moduleTabletService: ModuleTabletService,
  ) {}

  async buildModuleExcel(moduleName: string): Promise<ExportBuildResult> {
    const moduleKey = moduleName.toLowerCase() as ExportModuleKey;

    const validKeys = new Set<string>(EXPORT_MODULE_KEYS);
    if (!validKeys.has(moduleKey)) {
      throw new BadRequestException(
        `Modulo invalido. Usa uno de: ${EXPORT_MODULE_KEYS.join(', ')}`,
      );
    }

    const config = await this.resolveModuleConfig(moduleKey);
    const workbook = this.createWorkbook(config);
    const output = await workbook.xlsx.writeBuffer();
    const buffer = Buffer.isBuffer(output) ? output : Buffer.from(output);

    return {
      fileName: this.buildFileName(moduleKey),
      buffer,
    };
  }

  private async resolveModuleConfig(
    moduleKey: ExportModuleKey,
  ): Promise<ModuleExportConfig> {
    switch (moduleKey) {
      case 'modems': {
        const rows = (await this.moduleModemsService.findAllModems()) as Record<
          string,
          unknown
        >[];
        return {
          title: 'Inventario de Modems',
          sheetName: 'Modems',
          rows,
          columns: [
            { header: 'Marca', accessor: (row) => row.marca },
            { header: 'Modelo', accessor: (row) => row.modelo },
            { header: 'IMEI', accessor: (row) => row.imei_modem },
            {
              header: 'Estado Modem',
              accessor: (row) => row.estado_modem_desc ?? row.estado_modem,
            },
            {
              header: 'Estado Equipo',
              accessor: (row) => row.estado_equipo_desc ?? row.estado_equipo,
            },
            { header: 'Area', accessor: (row) => row.area_desc },
            { header: 'Usuario', accessor: (row) => row.usuario_desc ?? row.usuario },
            { header: 'Chip', accessor: (row) => row.chip_desc ?? row.num_Chip },
            { header: 'Activo', accessor: (row) => row.activo },
            { header: 'Fecha Registro', accessor: (row) => row.fecha_registro },
          ],
        };
      }
      case 'chips': {
        const rows = (await this.moduleChipsService.findAllChips()) as unknown as Record<
          string,
          unknown
        >[];
        return {
          title: 'Inventario de Chips',
          sheetName: 'Chips',
          rows,
          columns: [
            { header: 'Numero', accessor: (row) => row.numero_chip },
            { header: 'ICCID', accessor: (row) => row.iccid },
            {
              header: 'Tipo Chip',
              accessor: (row) =>
                this.getNestedValue(row, 'tipoChipRel.descripcion_tipo_chip'),
            },
            {
              header: 'Operador',
              accessor: (row) => this.getNestedValue(row, 'operadorRel.nombre_operador'),
            },
            {
              header: 'Area',
              accessor: (row) => this.getNestedValue(row, 'areaRel.nombre_area'),
            },
            {
              header: 'Colaborador',
              accessor: (row) =>
                this.getNestedValue(row, 'colaboradorRel.nombre_completo'),
            },
            {
              header: 'Estado Chip',
              accessor: (row) => this.getNestedValue(row, 'estadoChipRel.nombreChips'),
            },
            { header: 'Activo', accessor: (row) => row.activo },
            { header: 'Fecha Registro', accessor: (row) => row.fecha_registro },
          ],
        };
      }
      case 'celulares': {
        const rows = (await this.moduleCelularesService.findAllCelulares()) as Record<
          string,
          unknown
        >[];
        return {
          title: 'Inventario de Celulares',
          sheetName: 'Celulares',
          rows,
          columns: [
            { header: 'Marca', accessor: (row) => row.marca },
            { header: 'Modelo', accessor: (row) => row.modelo },
            { header: 'IMEI', accessor: (row) => row.imei_celular },
            {
              header: 'Estado Celular',
              accessor: (row) => row.estado_celular_desc ?? row.estado_celular,
            },
            {
              header: 'Estado Equipo',
              accessor: (row) => row.estado_equipo_desc ?? row.estado_equipo,
            },
            { header: 'Area', accessor: (row) => row.nombre_area },
            {
              header: 'Colaborador',
              accessor: (row) => row.nombre_colaborador ?? row.usuario,
            },
            { header: 'Chip', accessor: (row) => row.numero_chip_desc ?? row.numero_chip },
            { header: 'Activo', accessor: (row) => row.activo },
            { header: 'Fecha Registro', accessor: (row) => row.fecha_registro },
          ],
        };
      }
      case 'laptos': {
        const rows = (await this.laptosService.findAllPc()) as Record<string, unknown>[];
        return {
          title: 'Inventario de PCs y Laptops',
          sheetName: 'PCs-Laptops',
          rows,
          columns: [
            { header: 'Tipo Equipo', accessor: (row) => row.tipo_equipo },
            { header: 'Marca', accessor: (row) => row.marca },
            { header: 'Modelo', accessor: (row) => row.modelo },
            { header: 'Serie', accessor: (row) => row.serie },
            { header: 'Estado PC', accessor: (row) => row.estado_pc_desc ?? row.estado_pc },
            {
              header: 'Estado Equipo',
              accessor: (row) => row.estado_equipo_desc ?? row.estado_equipo,
            },
            { header: 'Area', accessor: (row) => row.nombre_area },
            {
              header: 'Colaborador',
              accessor: (row) => row.nombre_colaborador ?? row.usuario,
            },
            { header: 'Ubicacion', accessor: (row) => row.ubicacion },
            { header: 'Observaciones', accessor: (row) => row.observaciones },
            { header: 'Anexo', accessor: (row) => row.anexo },
            { header: 'Activo', accessor: (row) => row.activo },
            { header: 'Fecha Registro', accessor: (row) => row.fecha_registro },
          ],
        };
      }
      case 'monitores': {
        const rows = (await this.moduleMonitoresService.findAllMonitores()) as Record<
          string,
          unknown
        >[];
        return {
          title: 'Inventario de Monitores',
          sheetName: 'Monitores',
          rows,
          columns: [
            { header: 'Serie', accessor: (row) => row.serie },
            { header: 'Marca', accessor: (row) => row.marca },
            { header: 'Modelo', accessor: (row) => row.modelo },
            {
              header: 'Estado Monitor',
              accessor: (row) => row.estado_monitor_desc ?? row.estado_monitor,
            },
            {
              header: 'Status Monitor',
              accessor: (row) => row.status_monitor_desc ?? row.status_monitor,
            },
            { header: 'Area', accessor: (row) => row.nombre_area },
            {
              header: 'Colaborador',
              accessor: (row) => row.nombre_colaborador ?? row.usuario,
            },
            { header: 'Ubicacion', accessor: (row) => row.ubicacion },
            { header: 'Observaciones', accessor: (row) => row.observaciones },
            { header: 'Anexo', accessor: (row) => row.anexo },
            { header: 'Activo', accessor: (row) => row.activo },
            { header: 'Fecha Registro', accessor: (row) => row.fecha_registro },
          ],
        };
      }
      case 'tablets': {
        const rows = (await this.moduleTabletService.findAllTablets()) as Record<
          string,
          unknown
        >[];
        return {
          title: 'Inventario de Tablets',
          sheetName: 'Tablets',
          rows,
          columns: [
            { header: 'Marca', accessor: (row) => row.marca },
            { header: 'Modelo', accessor: (row) => row.modelo },
            { header: 'IMEI', accessor: (row) => row.imei_tablet },
            { header: 'Chip', accessor: (row) => row.chip_desc ?? row.num_chips },
            {
              header: 'Estado Tablet',
              accessor: (row) => row.estado_tablet_desc ?? row.estado_tablet,
            },
            {
              header: 'Estado Equipo',
              accessor: (row) => row.estado_equipo_desc ?? row.estado_equipo,
            },
            { header: 'Area', accessor: (row) => row.area_desc ?? row.id_area },
            { header: 'Colaborador', accessor: (row) => row.usuario_desc ?? row.usuario },
            { header: 'Ubicacion', accessor: (row) => row.ubicacion },
            { header: 'Observaciones', accessor: (row) => row.observaciones },
            { header: 'Activo', accessor: (row) => row.activo },
            { header: 'Fecha Registro', accessor: (row) => row.fecha_registro },
          ],
        };
      }
    }
  }

  private createWorkbook(config: ModuleExportConfig): ExcelJS.Workbook {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(config.sheetName, {
      views: [{ state: 'frozen', ySplit: 3 }],
    });

    const titleRowIndex = 1;
    const generatedAtRowIndex = 2;
    const headerRowIndex = 3;

    const titleRow = worksheet.getRow(titleRowIndex);
    titleRow.getCell(1).value = config.title;
    titleRow.font = { bold: true, size: 16, color: { argb: 'FF1F4E78' } };
    titleRow.alignment = { vertical: 'middle', horizontal: 'left' };
    titleRow.height = 26;

    const generatedAt = `Generado: ${new Date().toLocaleString('es-ES')}`;
    const generatedRow = worksheet.getRow(generatedAtRowIndex);
    generatedRow.getCell(1).value = generatedAt;
    generatedRow.font = { italic: true, size: 10, color: { argb: 'FF4B5563' } };
    generatedRow.height = 18;

    worksheet.mergeCells(
      titleRowIndex,
      1,
      titleRowIndex,
      Math.max(config.columns.length, 1),
    );
    worksheet.mergeCells(
      generatedAtRowIndex,
      1,
      generatedAtRowIndex,
      Math.max(config.columns.length, 1),
    );

    const headerRow = worksheet.getRow(headerRowIndex);
    headerRow.values = config.columns.map((col) => col.header);
    headerRow.height = 22;

    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1F4E78' },
      };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true,
      };
      cell.border = this.getBorderStyle('FFE5E7EB');
    });

    config.rows.forEach((rowData, index) => {
      const rowValues = config.columns.map((col) =>
        this.normalizeValue(col.accessor(rowData)),
      );
      const row = worksheet.addRow(rowValues);
      row.height = 20;

      const isEven = index % 2 === 0;
      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        cell.font = { size: 10, color: { argb: 'FF111827' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEven ? 'FFF9FAFB' : 'FFFFFFFF' },
        };
        cell.border = this.getBorderStyle('FFE5E7EB');
      });
    });

    worksheet.autoFilter = {
      from: { row: headerRowIndex, column: 1 },
      to: { row: headerRowIndex, column: config.columns.length },
    };

    worksheet.columns.forEach((column, index) => {
      const header = config.columns[index]?.header ?? '';
      const maxDataLength = config.rows.reduce((max, rowData) => {
        const raw = config.columns[index]?.accessor(rowData);
        const normalized = this.normalizeValue(raw);
        return Math.max(max, String(normalized).length);
      }, 0);
      const width = Math.min(Math.max(header.length, maxDataLength, 12), 42);
      column.width = width;
    });

    return workbook;
  }

  private buildFileName(moduleKey: ExportModuleKey): string {
    const date = new Date().toISOString().slice(0, 10);
    return `${moduleKey}-inventario-${date}.xlsx`;
  }

  private getNestedValue(record: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce<unknown>((acc, key) => {
      if (acc === null || acc === undefined || typeof acc !== 'object') {
        return undefined;
      }
      return (acc as Record<string, unknown>)[key];
    }, record);
  }

  private normalizeValue(value: unknown): string | number {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'Si' : 'No';
    if (value instanceof Date) return value.toLocaleString('es-ES');
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const asDate = new Date(value);
      if (!Number.isNaN(asDate.valueOf()) && /\d{4}-\d{2}-\d{2}/.test(value)) {
        return asDate.toLocaleString('es-ES');
      }
      return value;
    }
    return JSON.stringify(value);
  }

  private getBorderStyle(color: string): Partial<ExcelJS.Borders> {
    return {
      top: { style: 'thin', color: { argb: color } },
      left: { style: 'thin', color: { argb: color } },
      bottom: { style: 'thin', color: { argb: color } },
      right: { style: 'thin', color: { argb: color } },
    };
  }
}
