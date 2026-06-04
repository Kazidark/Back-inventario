import { BadRequestException, Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { CELULAR_EXCEL_HEADERS } from './celular-excel.constants';
import { LAPTOP_EXCEL_HEADERS } from './laptop-excel.constants';
import {
  LaptopExcelRow,
  ParsedLaptopExcelRow,
  buildLaptopExcelBuffer,
  mapLaptopStatusToEstadoEquipoText,
  mapLaptopStatusToEstadoPcText,
  getLaptopObservacionFromExcel,
  getLaptopSerieFromExcelItem,
  parseLaptopActivoFromExcel,
  parseLaptopExcelWorksheet,
  repairLaptopExcelRow,
  resolveLaptopExcelSource,
} from './laptop-excel.util';
import {
  CelularExcelRow,
  ParsedCelularExcelRow,
  buildCelularExcelBuffer,
  findCelularHeaderRowNumber,
  parseCelularExcelWorksheet,
  repairCelularExcelRow,
} from './celular-excel.util';
import { TABLET_EXCEL_HEADERS } from './tablet-excel.constants';
import {
  TabletExcelRow,
  ParsedTabletExcelRow,
  buildTabletExcelBuffer,
  getTabletImeiFromExcelItem,
  getTabletObservacionFromExcel,
  isTabletIccidLinkable,
  parseTabletActivoFromExcel,
  parseTabletExcelWorksheet,
  mapTabletEstadoEquipoText,
  mapTabletEstadoOperativoText,
  mapTabletUbicacionText,
  repairTabletExcelRow,
  resolveTabletExcelSource,
} from './tablet-excel.util';
import { CHIP_EXCEL_HEADERS } from './chip-excel.constants';
import {
  ChipExcelRow,
  ParsedChipExcelRow,
  buildChipExcelBuffer,
  findChipHeaderRowNumber,
  parseChipExcelWorksheet,
  repairChipExcelRow,
} from './chip-excel.util';
import { MODEM_EXCEL_HEADERS } from './modem-excel.constants';
import {
  ModemExcelRow,
  ParsedModemExcelRow,
  buildModemExcelBuffer,
  findMasterCatalogMatch,
  findModemHeaderRowNumber,
  normalizeLookupValue,
  parseModemExcelWorksheet,
  parseNumericId,
} from './modem-excel.util';
import { EntityMoculesModems } from '../module-modems/entities/module-modem.entity';
import { DeepPartial, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  MarterDataArea,
  MasterDataAsignacion,
  MasterDataColaborador,
  MasterDataEstadoChip,
  MasterDataEstadoEquipo,
  MasterDataOperadores,
  MasterDataTipoChip,
  MasterDataUbicacion,
} from '../master-data/entities/master-datum.entity';
import { EntityMoculesChips } from '../module-chips/entities/module-chip.entity';
import { ModuleCelulare } from '../module-celulares/entities/module-celulare.entity';
import { Lapto } from '../module-pc/laptos/entities/lapto.entity';
import { ModuleMonitore } from '../module-monitores/entities/module-monitore.entity';
import { ModuleTablet } from '../module-tablet/entities/module-tablet.entity';

const KNOWN_CHIP_OPERADOR_NAMES = new Set([
  'MOVISTAR',
  'CLARO',
  'ENTEL',
  'VITEL',
]);

@Injectable()
export class SubirArchivoService {
  // Extensiones de archivos OpenXML que ExcelJS puede leer con workbook.xlsx.load.
  private readonly allowedExtensions = new Set(['xlsx', 'xlsm', 'xltx', 'xltm']);
  // Algunos navegadores/sistemas envían mimetypes genéricos; se contemplan para no rechazar cargas válidas.
  private readonly allowedMimeTypes = new Set([
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel.sheet.macroenabled.12',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
    'application/vnd.ms-excel.template.macroenabled.12',
    'application/octet-stream',
  ]);

  constructor(
    @InjectRepository(EntityMoculesModems)
    readonly moduleModemsRepository: Repository<EntityMoculesModems>,
    @InjectRepository(MasterDataEstadoEquipo)
    readonly masterDataEstadoEquipoRepository: Repository<MasterDataEstadoEquipo>,
    @InjectRepository(MasterDataAsignacion)
    readonly masterDataAsignacionRepository: Repository<MasterDataAsignacion>,
    @InjectRepository(MarterDataArea)
    readonly marterDataAreaRepository: Repository<MarterDataArea>,
    @InjectRepository(MasterDataColaborador)
    readonly masterDataColaboradorRepository: Repository<MasterDataColaborador>,
    @InjectRepository(MasterDataEstadoChip)
    readonly masterDataEstadoChipRepository: Repository<MasterDataEstadoChip>,
    @InjectRepository(MasterDataOperadores)
    readonly masterDataOperadoresRepository: Repository<MasterDataOperadores>,
    @InjectRepository(MasterDataTipoChip)
    readonly masterDataTipoChipRepository: Repository<MasterDataTipoChip>,
    @InjectRepository(EntityMoculesChips)
    readonly moduleChipsRepository: Repository<EntityMoculesChips>,
    @InjectRepository(ModuleCelulare)
    readonly moduleCelularesRepository: Repository<ModuleCelulare>,
    @InjectRepository(Lapto)
    readonly laptoRepository: Repository<Lapto>,
    @InjectRepository(ModuleMonitore)
    readonly moduleMonitoresRepository: Repository<ModuleMonitore>,
    @InjectRepository(ModuleTablet)
    readonly moduleTabletRepository: Repository<ModuleTablet>,
    @InjectRepository(MasterDataUbicacion)
    readonly masterDataUbicacionRepository: Repository<MasterDataUbicacion>,
  ) {}
  private readonly allowedHeadersChips = [
    'NUMERO',
    'NÚMERO',
    'ICCID',
    'ESTADO',
    'OPERADOR',
    'AREA',
    'USUARIO',
    'TIPO',
    'OBSERVACIONES',
    '#TICKET',
    'TICKET',
    'CORREO',
  ];

  private readonly allowedHeadersMonitores = [
    'SERIE',
    'MARCA',
    'MODELO',
    'ESTADO',
    'STATUS',
    'AREA',
    'USUARIO',
    'UBICACION',
    'OBSERVACION',
    'ANEXO',
  ];

  private readonly allowedHeadersTablets = [
    'NOMBRE',
    'MARCA',
    'MODELO',
    'IMEI',
    'SERIE',
    'ESTADO TABLET',
    'ESTADO EQUI',
    'AREA',
    'OBS1',
    'KIOSKO',
    'PROVEEDOR',
    '#TAB_REPOSI',
    '#TICKET',
    'CORREO',
  ];

  async buildModemTemplateExcel(): Promise<{ fileName: string; buffer: Buffer }> {
    const buffer = await buildModemExcelBuffer([]);
    return {
      fileName: 'modem-plantilla.xlsx',
      buffer,
    };
  }

  async buildChipTemplateExcel(): Promise<{ fileName: string; buffer: Buffer }> {
    const buffer = await buildChipExcelBuffer([]);
    return {
      fileName: 'chip-plantilla.xlsx',
      buffer,
    };
  }

  async buildCelularTemplateExcel(): Promise<{ fileName: string; buffer: Buffer }> {
    const buffer = await buildCelularExcelBuffer([]);
    return {
      fileName: 'celular-plantilla.xlsx',
      buffer,
    };
  }

  async buildLaptopTemplateExcel(): Promise<{ fileName: string; buffer: Buffer }> {
    const buffer = await buildLaptopExcelBuffer([]);
    return {
      fileName: 'laptop-plantilla.xlsx',
      buffer,
    };
  }

  async buildTabletTemplateExcel(): Promise<{ fileName: string; buffer: Buffer }> {
    const buffer = await buildTabletExcelBuffer([]);
    return {
      fileName: 'tablet-plantilla.xlsx',
      buffer,
    };
  }

  async processExcel(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo');
    }

    const extension = file.originalname.split('.').pop()?.toLowerCase() ?? '';
    const mimetype = file.mimetype.toLowerCase();
    if (!this.allowedExtensions.has(extension) && !this.allowedMimeTypes.has(mimetype)) {
      throw new BadRequestException(
        'El archivo debe ser Excel válido (.xlsx, .xlsm, .xltx, .xltm)',
      );
    }

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.buffer as any);
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new BadRequestException('El archivo Excel no contiene hojas');
      }

      if (findModemHeaderRowNumber(worksheet) === null) {
        throw new BadRequestException(
          `No se encontró encabezado de módems. Use las columnas: ${MODEM_EXCEL_HEADERS.join(', ')}`,
        );
      }

      const parsedRows = parseModemExcelWorksheet(worksheet);
      const insertSummary = await this.insertDataDBModem(parsedRows);

      return {
        success: true,
        message: `Archivo procesado. Nuevos: ${insertSummary.inserted}, actualizados: ${insertSummary.updated}, sin cambios: ${insertSummary.unchanged}, estado equipo OK: ${insertSummary.estadoEquipoResolved}, chips creados: ${insertSummary.chipsCreated}, chips vinculados: ${insertSummary.chipLinked}, chips sin vincular: ${insertSummary.chipMissing}, sin IMEI: ${insertSummary.skippedWithoutImei}.`,
        totalRows: parsedRows.length,
        result: [insertSummary],
        summary: insertSummary,
        headers: [...MODEM_EXCEL_HEADERS],
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        `Error al procesar el archivo: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async processExcelCelulares(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo');
    }

    const extension = file.originalname.split('.').pop()?.toLowerCase() ?? '';
    const mimetype = file.mimetype.toLowerCase();
    if (
      !this.allowedExtensions.has(extension) &&
      !this.allowedMimeTypes.has(mimetype)
    ) {
      throw new BadRequestException(
        'El archivo debe ser Excel válido (.xlsx, .xlsm, .xltx, .xltm)',
      );
    }

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.buffer as any);
      const worksheet = workbook.worksheets[0];

      if (!worksheet) {
        throw new BadRequestException('El archivo Excel no contiene hojas');
      }

      if (findCelularHeaderRowNumber(worksheet) === null) {
        throw new BadRequestException(
          `No se encontró encabezado de celulares. Use columnas como: ${CELULAR_EXCEL_HEADERS.join(', ')} (o EQUIPO-MARCA, EQUIPO-MODELO, IMEI, Estado del Excel legacy).`,
        );
      }

      const parsedRows = parseCelularExcelWorksheet(worksheet);
      const insertSummary = await this.insertDataDBCelulares(parsedRows);

      return {
        success: true,
        message: `Archivo de celulares procesado. Nuevos: ${insertSummary.inserted}, actualizados: ${insertSummary.updated}, sin cambios: ${insertSummary.unchanged}, sin IMEI: ${insertSummary.skippedWithoutImei}, chips creados: ${insertSummary.chipsCreated}, chips vinculados: ${insertSummary.chipLinked}, chips sin vincular: ${insertSummary.chipMissing}.`,
        totalRows: parsedRows.length,
        result: [insertSummary],
        summary: insertSummary,
        headers: [...CELULAR_EXCEL_HEADERS],
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        `Error al procesar el archivo de celulares: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Normaliza el contenido de una celda ExcelJS a string limpio o null.
  private getCellString(
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

  // Intenta leer un campo probando varias llaves (útil para encabezados con variantes/errores tipográficos).
  private getExcelField(item: Record<string, ExcelJS.CellValue>, ...keys: string[]) {
    for (const key of keys) {
      if (key in item) {
        return this.getCellString(item[key]);
      }
    }
    return null;
  }

  // Resoluciones de llaves foráneas por catálogo maestro.
  private async findEstadoModemId(value: string | null): Promise<number | null> {
    if (!value) return null;
    const estado = await this.masterDataEstadoEquipoRepository.findOne({
      where: { descripcion: value },
    });
    return estado?.id_estado ?? null;
  }

  private async findEstadoEquipoId(value: string | null): Promise<number | null> {
    if (!value) return null;
    const asignacion = await this.masterDataAsignacionRepository.findOne({
      where: { descripcion: value },
    });
    return asignacion?.id_asignado ?? null;
  }

  private async findAreaId(value: string | null): Promise<number | null> {
    if (!value) return null;
    const area = await this.marterDataAreaRepository.findOne({
      where: { nombre_area: value },
    });
    return area?.id_area ?? null;
  }

  private async findColaboradorId(value: string | null): Promise<number | null> {
    if (!value) return null;
    const colaborador = await this.masterDataColaboradorRepository.findOne({
      where: { nombre_completo: value },
    });
    return colaborador?.id_colaborador ?? null;
  }

  private async findChipId(value: string | null): Promise<number | null> {
    if (!value) return null;
    const chip = await this.moduleChipsRepository.findOne({
      where: { numero_chip: value },
    });
    return chip?.id_chip ?? null;
  }

  private async findEstadoChipId(value: string | null): Promise<number | null> {
    if (!value) return null;
    if (/^\d+$/.test(value)) return Number(value);
    const estado = await this.masterDataEstadoChipRepository.findOne({
      where: { nombreChips: value },
    });
    return estado?.id_estadoChip ?? null;
  }

  private async findOperadorId(value: string | null): Promise<number | null> {
    if (!value) return null;
    if (/^\d+$/.test(value)) return Number(value);
    const operador = await this.masterDataOperadoresRepository.findOne({
      where: { nombre_operador: value },
    });
    return operador?.id_operador ?? null;
  }

  private async findTipoChipId(value: string | null): Promise<number | null> {
    if (!value) return null;
    if (/^\d+$/.test(value)) return Number(value);
    const tipo = await this.masterDataTipoChipRepository.findOne({
      where: { descripcion_tipo_chip: value },
    });
    return tipo?.id_tipo_chip ?? null;
  }

  private normalizeHeader(header: string): string {
    return header
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private normalizeValue(value: string): string {
    return value
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private truncateValue(value: string | null, maxLength: number): string {
    if (!value) return '';
    return value.trim().slice(0, maxLength);
  }

  /** Extrae dígitos para columna ANEXO (ej. ANEXO 017 -> 17). */
  private parseAnexoInt(value: string | null): number | null {
    if (!value) return null;
    const m = value.match(/\d+/);
    if (!m) return null;
    const n = parseInt(m[0], 10);
    return Number.isFinite(n) ? n : null;
  }

  async insertDataDBModem(
    dataInsert: ParsedModemExcelRow[],
  ): Promise<{
    inserted: number;
    updated: number;
    unchanged: number;
    duplicateInFile: number;
    skippedWithoutImei: number;
    estadoEquipoResolved: number;
    estadoEquipoMissing: number;
    chipsCreated: number;
    chipLinked: number;
    chipMissing: number;
    warnings: string[];
  }> {
    const imeisFromFile = dataInsert
      .map((row) => row.item.IMEI?.trim())
      .filter((imei): imei is string => Boolean(imei));

    const uniqueImeisFromFile = [...new Set(imeisFromFile)];
    const existingModems = uniqueImeisFromFile.length
      ? await this.moduleModemsRepository.find({
          where: { imei_modem: In(uniqueImeisFromFile) },
        })
      : [];

    const existingByImei = new Map(
      existingModems
        .filter((m) => m.imei_modem)
        .map((m) => [m.imei_modem as string, m]),
    );

    const [allAreas, allAsignacion, allEstadoModem, allColaboradores, allChips] =
      await Promise.all([
        this.marterDataAreaRepository.find(),
        this.masterDataAsignacionRepository.find(),
        this.masterDataEstadoEquipoRepository.find(),
        this.masterDataColaboradorRepository.find(),
        this.moduleChipsRepository.find({ select: ['id_chip', 'numero_chip'] }),
      ]);

    const chipsByNumero = new Map<string, number>();
    const chipsById = new Map<number, string>();
    for (const chip of allChips) {
      if (!chip.numero_chip) continue;
      const key = chip.numero_chip.replace(/\D/g, '');
      if (key) chipsByNumero.set(key, chip.id_chip);
      chipsById.set(chip.id_chip, chip.numero_chip);
    }

    const warnings: string[] = [];
    const chipsCreated = await this.ensureChipsForModemImport(
      dataInsert,
      chipsByNumero,
      chipsById,
      warnings,
    );

    const seenInCurrentFile = new Set<string>();
    let inserted = 0;
    let updated = 0;
    let unchanged = 0;
    let duplicateInFile = 0;
    let skippedWithoutImei = 0;
    let estadoEquipoResolved = 0;
    let estadoEquipoMissing = 0;
    let chipLinked = 0;
    let chipMissing = 0;
    const toInsert: EntityMoculesModems[] = [];
    const toUpdate: EntityMoculesModems[] = [];

    for (const { excelRow, item } of dataInsert) {
      const imei = item.IMEI?.trim();
      if (!imei) {
        skippedWithoutImei += 1;
        continue;
      }

      if (seenInCurrentFile.has(imei)) {
        duplicateInFile += 1;
        warnings.push(`Fila ${excelRow}: IMEI duplicado en el archivo "${imei}"`);
        continue;
      }
      seenInCurrentFile.add(imei);

      const existingModem = existingByImei.get(imei);

      const modemPayload = this.buildModemPayloadFromExcelRow(
        item,
        imei,
        excelRow,
        allEstadoModem,
        allAsignacion,
        allAreas,
        allColaboradores,
        chipsByNumero,
        chipsById,
        warnings,
        existingModem,
      );

      const estadoEquipoText = item['ESTADO DEL EQUIPO']?.trim();
      if (estadoEquipoText) {
        if (modemPayload.estado_equipo != null) {
          estadoEquipoResolved += 1;
        } else {
          estadoEquipoMissing += 1;
        }
      }

      const chipText = item['NUMERO CHIP']?.trim();
      if (chipText) {
        if (modemPayload.num_Chip != null) {
          chipLinked += 1;
        } else {
          chipMissing += 1;
        }
      }

      if (existingModem?.id_modem) {
        const nextActivo = this.parseActivoExcel(
          item.ACTIVO,
          existingModem.activo ?? true,
        );
        const mustLinkChip =
          modemPayload.num_Chip != null &&
          (existingModem.num_Chip == null ||
            existingModem.num_Chip !== modemPayload.num_Chip);
        const mustLinkEstadoEquipo =
          modemPayload.estado_equipo != null &&
          (existingModem.estado_equipo == null ||
            existingModem.estado_equipo !== modemPayload.estado_equipo);
        if (
          !this.modemPayloadHasChanges(existingModem, modemPayload) &&
          !mustLinkChip &&
          !mustLinkEstadoEquipo &&
          Boolean(existingModem.activo ?? true) === nextActivo
        ) {
          unchanged += 1;
          continue;
        }
        toUpdate.push(
          this.moduleModemsRepository.create({
            id_modem: existingModem.id_modem,
            ...modemPayload,
            fecha_registro: existingModem.fecha_registro,
            activo: nextActivo,
          }),
        );
        updated += 1;
        continue;
      }

      toInsert.push(
        this.moduleModemsRepository.create({
          ...modemPayload,
          fecha_registro: new Date(),
          activo: this.parseActivoExcel(item.ACTIVO, true),
        }),
      );
      inserted += 1;
    }

    const BATCH = 80;
    try {
      for (let i = 0; i < toInsert.length; i += BATCH) {
        await this.moduleModemsRepository.save(toInsert.slice(i, i + BATCH));
      }
      for (let i = 0; i < toUpdate.length; i += BATCH) {
        await this.moduleModemsRepository.save(toUpdate.slice(i, i + BATCH));
      }
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : 'Error al guardar en base de datos';
      throw new BadRequestException(
        `No se pudieron crear/actualizar módems: ${msg}`,
      );
    }

    return {
      inserted,
      updated,
      unchanged,
      duplicateInFile,
      skippedWithoutImei,
      estadoEquipoResolved,
      estadoEquipoMissing,
      chipsCreated,
      chipLinked,
      chipMissing,
      warnings: warnings.slice(0, 50),
    };
  }

  /**
   * Crea en `chips` los números del Excel que aún no existen, para poder guardar modems.num_Chip (FK).
   */
  private async ensureChipsForModemImport(
    rows: ParsedModemExcelRow[],
    chipsByNumero: Map<string, number>,
    chipsById: Map<number, string>,
    warnings: string[],
  ): Promise<number> {
    const [allEstadosChip, allOperadores] = await Promise.all([
      this.masterDataEstadoChipRepository.find(),
      this.masterDataOperadoresRepository.find(),
    ]);
    const defaultEstadoChipId = allEstadosChip[0]?.id_estadoChip ?? null;
    const defaultOperadorId = allOperadores[0]?.id_operador ?? null;
    if (!defaultEstadoChipId || !defaultOperadorId) {
      warnings.push(
        'No hay catálogo de estado u operador de chip; no se pueden crear chips desde el Excel de módems.',
      );
      return 0;
    }

    const pending = new Map<
      string,
      { iccid?: string | null; operadorText?: string | null }
    >();

    for (const { item } of rows) {
      const raw = item['NUMERO CHIP']?.trim();
      if (!raw) continue;
      const digits = raw.replace(/\D/g, '');
      if (digits.length !== 9) {
        continue;
      }
      if (chipsByNumero.has(digits)) continue;
      if (!pending.has(digits)) {
        pending.set(digits, {
          iccid: item.ICCID ?? null,
          operadorText: item.OPERADOR ?? null,
        });
      }
    }

    if (pending.size === 0) return 0;

    const existingIccids = new Set(
      (
        await this.moduleChipsRepository.find({
          select: ['iccid'],
        })
      )
        .map((c) => c.iccid?.trim())
        .filter((v): v is string => Boolean(v)),
    );
    const usedIccids = new Set(existingIccids);
    let createdCount = 0;

    for (const [digits, meta] of pending) {
      let operadorId = defaultOperadorId;
      if (meta.operadorText) {
        const normalized = this.normalizeValue(meta.operadorText);
        const hit = allOperadores.find(
          (o) => this.normalizeValue(o.nombre_operador) === normalized,
        );
        if (hit) operadorId = hit.id_operador;
      }

      let iccid = this.truncateValue(meta.iccid ?? '', 25) ?? '';
      if (!iccid || usedIccids.has(iccid)) {
        iccid = digits;
      }
      if (usedIccids.has(iccid)) {
        iccid = `${digits}${createdCount}`.slice(0, 25);
      }
      usedIccids.add(iccid);

      try {
        const saved = await this.moduleChipsRepository.save(
          this.moduleChipsRepository.create({
            numero_chip: digits,
            iccid,
            estado_chip: defaultEstadoChipId,
            operador: operadorId,
            ticket: '',
            observacion: 'Creado al importar Excel de módems',
            correo_electronico: '',
            fecha_registro: new Date(),
            activo: true,
          }),
        );
        const key = saved.numero_chip?.replace(/\D/g, '') ?? digits;
        chipsByNumero.set(key, saved.id_chip);
        chipsById.set(saved.id_chip, saved.numero_chip ?? digits);
        createdCount += 1;
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : 'Error al crear chip';
        warnings.push(`Chip ${digits}: ${msg}`);
      }
    }

    return createdCount;
  }

  private buildModemPayloadFromExcelRow(
    item: ModemExcelRow,
    imei: string,
    excelRow: number,
    allEstadoModem: MasterDataEstadoEquipo[],
    allAsignacion: MasterDataAsignacion[],
    allAreas: MarterDataArea[],
    allColaboradores: MasterDataColaborador[],
    chipsByNumero: Map<string, number>,
    chipsById: Map<number, string>,
    warnings: string[],
    existingModem?: EntityMoculesModems,
  ): DeepPartial<EntityMoculesModems> {
    const estadoModemId = this.resolveEstadoModemId(
      item['ESTADO OPERATIVO'],
      allEstadoModem,
      excelRow,
      warnings,
    );
    const estadoEquipoId = this.resolveEstadoEquipoId(
      item['ESTADO DEL EQUIPO'],
      allAsignacion,
      excelRow,
      warnings,
    );
    const areaId = this.resolveAreaId(item.AREA, allAreas, excelRow, warnings);
    const colaboradorId = this.resolveColaboradorId(
      item.USUARIO,
      allColaboradores,
      excelRow,
      warnings,
    );
    const chipId = this.resolveChipId(
      item['NUMERO CHIP'],
      chipsByNumero,
      chipsById,
      excelRow,
      warnings,
    );

    return {
      marca: item.MARCA ?? existingModem?.marca ?? null,
      modelo: item.MODELO ?? existingModem?.modelo ?? null,
      imei_modem: imei,
      estado_modem: this.coalesceFkOnUpdate(
        item['ESTADO OPERATIVO'],
        estadoModemId,
        existingModem?.estado_modem,
      ),
      estado_equipo: this.coalesceFkOnUpdate(
        item['ESTADO DEL EQUIPO'],
        estadoEquipoId,
        existingModem?.estado_equipo,
      ),
      id_area: this.coalesceFkOnUpdate(item.AREA, areaId, existingModem?.id_area),
      usuario: this.coalesceFkOnUpdate(
        item.USUARIO,
        colaboradorId,
        existingModem?.usuario,
      ),
      num_Chip: this.coalesceFkOnUpdate(
        item['NUMERO CHIP'],
        chipId,
        existingModem?.num_Chip,
      ),
      ticket: this.coalesceTextOnUpdate(
        item.TICKET,
        existingModem?.ticket,
      ),
    };
  }

  /** Si la celda Excel viene vacía al actualizar, conserva el valor en BD. */
  private coalesceFkOnUpdate(
    excelText: string | null | undefined,
    resolvedId: number | null,
    existingId?: number | null,
  ): number | null {
    if (excelText == null || String(excelText).trim() === '') {
      return existingId ?? null;
    }
    return resolvedId;
  }

  private parseActivoExcel(
    value: string | null | undefined,
    fallback: boolean,
  ): boolean {
    if (value == null || String(value).trim() === '') return fallback;
    const v = normalizeLookupValue(value);
    if (['SI', 'S', '1', 'TRUE', 'ACTIVO'].includes(v)) return true;
    if (['NO', 'N', '0', 'FALSE', 'INACTIVO'].includes(v)) return false;
    return fallback;
  }

  private coalesceTextOnUpdate(
    excelText: string | null | undefined,
    existing?: string | null,
  ): string | null {
    if (excelText == null || String(excelText).trim() === '') {
      return existing ?? null;
    }
    return this.truncateValue(excelText, 255);
  }

  private modemPayloadHasChanges(
    existing: EntityMoculesModems,
    next: DeepPartial<EntityMoculesModems>,
  ): boolean {
    const norm = (v: unknown) => (v === undefined || v === '' ? null : v);
    return (
      norm(existing.marca) !== norm(next.marca) ||
      norm(existing.modelo) !== norm(next.modelo) ||
      norm(existing.estado_modem) !== norm(next.estado_modem) ||
      norm(existing.estado_equipo) !== norm(next.estado_equipo) ||
      norm(existing.id_area) !== norm(next.id_area) ||
      norm(existing.usuario) !== norm(next.usuario) ||
      norm(existing.num_Chip) !== norm(next.num_Chip) ||
      norm(existing.ticket) !== norm(next.ticket)
    );
  }

  private resolveEstadoModemId(
    value: string | null | undefined,
    catalog: MasterDataEstadoEquipo[],
    excelRow: number,
    warnings: string[],
  ): number | null {
    if (!value) return null;
    const byId = parseNumericId(value);
    if (byId !== null && catalog.some((x) => x.id_estado === byId)) {
      return byId;
    }
    const hit = findMasterCatalogMatch(value, catalog, (x) => x.descripcion);
    if (!hit) {
      warnings.push(
        `Fila ${excelRow}: ESTADO OPERATIVO "${value}" no está en catálogo de estados de equipo`,
      );
      return null;
    }
    return hit.id_estado;
  }

  /** Excel "ESTADO DEL EQUIPO" → modems.estado_equipo (FK TBLM_asignacion.id_asignado). */
  private resolveEstadoEquipoId(
    value: string | null | undefined,
    catalog: MasterDataAsignacion[],
    excelRow: number,
    warnings: string[],
  ): number | null {
    if (!value) return null;
    const byId = parseNumericId(value);
    if (byId !== null && catalog.some((x) => x.id_asignado === byId)) {
      return byId;
    }
    const hit = findMasterCatalogMatch(value, catalog, (x) => x.descripcion);
    if (!hit) {
      const ejemplos = catalog
        .slice(0, 8)
        .map((x) => x.descripcion)
        .join(', ');
      warnings.push(
        `Fila ${excelRow}: ESTADO DEL EQUIPO "${value}" no está en TBLM_asignacion (ej: ${ejemplos}${catalog.length > 8 ? '…' : ''})`,
      );
      return null;
    }
    return hit.id_asignado;
  }

  private resolveAreaId(
    value: string | null | undefined,
    catalog: MarterDataArea[],
    excelRow: number,
    warnings: string[],
  ): number | null {
    if (!value) return null;
    const byId = parseNumericId(value);
    if (byId !== null && catalog.some((x) => x.id_area === byId)) {
      return byId;
    }
    const hit = findMasterCatalogMatch(value, catalog, (x) => x.nombre_area);
    if (!hit) {
      warnings.push(
        `Fila ${excelRow}: AREA "${value}" no está en catálogo de áreas`,
      );
      return null;
    }
    return hit.id_area;
  }

  private resolveColaboradorId(
    value: string | null | undefined,
    catalog: MasterDataColaborador[],
    excelRow: number,
    warnings: string[],
  ): number | null {
    if (!value) return null;
    const byId = parseNumericId(value);
    if (byId !== null && catalog.some((x) => x.id_colaborador === byId)) {
      return byId;
    }
    const hit = findMasterCatalogMatch(
      value,
      catalog,
      (x) => x.nombre_completo,
    );
    if (!hit) {
      warnings.push(
        `Fila ${excelRow}: USUARIO "${value}" no está en catálogo de colaboradores`,
      );
      return null;
    }
    return hit.id_colaborador;
  }

  private resolveChipId(
    value: string | null | undefined,
    chipsByNumero: Map<string, number>,
    chipsById: Map<number, string>,
    excelRow: number,
    warnings: string[],
  ): number | null {
    if (!value) return null;
    const normalized = normalizeLookupValue(value);
    if (
      normalized.includes('SIN INFORM') ||
      normalized === '-' ||
      normalized === 'N/A' ||
      normalized === 'NA'
    ) {
      return null;
    }
    const byId = parseNumericId(value);
    if (byId !== null && chipsById.has(byId)) {
      return byId;
    }
    const digits = value.replace(/\D/g, '');
    if (!digits) return null;
    const chipId = chipsByNumero.get(digits);
    if (!chipId) {
      if (digits.length === 9) {
        warnings.push(
          `Fila ${excelRow}: NUMERO CHIP "${value}" no se pudo vincular (revise catálogo chips)`,
        );
      } else {
        warnings.push(
          `Fila ${excelRow}: NUMERO CHIP "${value}" inválido (debe tener 9 dígitos)`,
        );
      }
      return null;
    }
    return chipId;
  }

  async insertDataDBCelulares(
    dataInsert: ParsedCelularExcelRow[],
  ): Promise<{
    inserted: number;
    updated: number;
    unchanged: number;
    duplicateInFile: number;
    skippedWithoutImei: number;
    chipsCreated: number;
    chipLinked: number;
    chipMissing: number;
    warnings: string[];
  }> {
    const imeisFromFile = dataInsert
      .map((row) => row.item.IMEI?.trim())
      .filter((imei): imei is string => Boolean(imei));

    const uniqueImeisFromFile = [...new Set(imeisFromFile)];
    const existingCelulares = uniqueImeisFromFile.length
      ? await this.moduleCelularesRepository.find({
          where: { imei_celular: In(uniqueImeisFromFile) },
        })
      : [];

    const existingByImei = new Map(
      existingCelulares
        .filter((c) => c.imei_celular)
        .map((c) => [c.imei_celular as string, c]),
    );

    const [allAreas, allAsignacion, allEstadoCelular, allColaboradores, allChips] =
      await Promise.all([
        this.marterDataAreaRepository.find(),
        this.masterDataAsignacionRepository.find(),
        this.masterDataEstadoEquipoRepository.find(),
        this.masterDataColaboradorRepository.find(),
        this.moduleChipsRepository.find({
          select: ['id_chip', 'iccid', 'numero_chip'],
        }),
      ]);

    const chipsByIccid = new Map<string, number>();
    const chipsByNumero = new Map<string, number>();
    for (const chip of allChips) {
      const iccid = chip.iccid?.trim();
      if (iccid) chipsByIccid.set(iccid, chip.id_chip);
      if (chip.numero_chip) {
        const key = chip.numero_chip.replace(/\D/g, '');
        if (key) chipsByNumero.set(key, chip.id_chip);
      }
    }

    const warnings: string[] = [];
    const chipsCreated = await this.ensureChipsForCelularImport(
      dataInsert,
      chipsByIccid,
      chipsByNumero,
      warnings,
    );

    const seenInCurrentFile = new Set<string>();
    let inserted = 0;
    let updated = 0;
    let unchanged = 0;
    let duplicateInFile = 0;
    let skippedWithoutImei = 0;
    let chipLinked = 0;
    let chipMissing = 0;
    const toInsert: ModuleCelulare[] = [];
    const toUpdate: ModuleCelulare[] = [];

    for (const { excelRow, item: rawItem } of dataInsert) {
      const item = repairCelularExcelRow(rawItem);
      const imei = item.IMEI?.trim();
      if (!imei) {
        skippedWithoutImei += 1;
        continue;
      }

      if (seenInCurrentFile.has(imei)) {
        duplicateInFile += 1;
        warnings.push(`Fila ${excelRow}: IMEI duplicado en el archivo "${imei}"`);
        continue;
      }
      seenInCurrentFile.add(imei);

      const existingCelular = existingByImei.get(imei);
      const celularPayload = this.buildCelularPayloadFromExcelRow(
        item,
        imei,
        excelRow,
        allEstadoCelular,
        allAsignacion,
        allAreas,
        allColaboradores,
        chipsByIccid,
        warnings,
        existingCelular,
      );

      const iccidText = item.ICCID?.trim();
      if (iccidText) {
        if (celularPayload.numero_chip != null) {
          chipLinked += 1;
        } else {
          chipMissing += 1;
        }
      }

      if (existingCelular?.id_celular) {
        const nextActivo = this.parseActivoExcel(
          item.ACTIVO,
          existingCelular.activo ?? true,
        );
        const mustLinkChip =
          celularPayload.numero_chip != null &&
          (existingCelular.numero_chip == null ||
            existingCelular.numero_chip !== celularPayload.numero_chip);
        const mustLinkEstadoEquipo =
          celularPayload.estado_equipo != null &&
          (existingCelular.estado_equipo == null ||
            existingCelular.estado_equipo !== celularPayload.estado_equipo);
        const mustFixMarcaModelo = this.celularMustFixMarcaModelo(
          item,
          existingCelular,
          celularPayload,
        );
        const mustFixCorreoTicket = this.celularMustFixCorreoTicket(
          item,
          existingCelular,
          celularPayload,
        );
        const mustFixObservacion = this.celularMustFixObservacion(
          item,
          existingCelular,
          celularPayload,
        );
        const mustSyncExcelTexts =
          mustFixCorreoTicket ||
          mustFixObservacion ||
          this.celularMustForceExcelTextSync(item, existingCelular, celularPayload);
        if (
          !this.celularPayloadHasChanges(existingCelular, celularPayload) &&
          !mustLinkChip &&
          !mustLinkEstadoEquipo &&
          !mustFixMarcaModelo &&
          !mustSyncExcelTexts &&
          Boolean(existingCelular.activo ?? true) === nextActivo
        ) {
          unchanged += 1;
          continue;
        }
        toUpdate.push(
          this.moduleCelularesRepository.create({
            id_celular: existingCelular.id_celular,
            ...celularPayload,
            fecha_registro: existingCelular.fecha_registro,
            activo: nextActivo,
          }),
        );
        updated += 1;
        continue;
      }

      toInsert.push(
        this.moduleCelularesRepository.create({
          ...celularPayload,
          fecha_registro: new Date(),
          activo: this.parseActivoExcel(item.ACTIVO, true),
        }),
      );
      inserted += 1;
    }

    const BATCH = 80;
    try {
      for (let i = 0; i < toInsert.length; i += BATCH) {
        await this.moduleCelularesRepository.save(toInsert.slice(i, i + BATCH));
      }
      for (let i = 0; i < toUpdate.length; i += BATCH) {
        await this.moduleCelularesRepository.save(toUpdate.slice(i, i + BATCH));
      }
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : 'Error al guardar en base de datos';
      throw new BadRequestException(
        `No se pudieron crear/actualizar celulares: ${msg}`,
      );
    }

    return {
      inserted,
      updated,
      unchanged,
      duplicateInFile,
      skippedWithoutImei,
      chipsCreated,
      chipLinked,
      chipMissing,
      warnings: warnings.slice(0, 50),
    };
  }

  /**
   * Crea chips faltantes por ICCID del Excel de celulares (FK celulares.numero_chip → chips.id_chip).
   */
  private async ensureChipsForCelularImport(
    rows: ParsedCelularExcelRow[],
    chipsByIccid: Map<string, number>,
    chipsByNumero: Map<string, number>,
    warnings: string[],
  ): Promise<number> {
    const [allEstadosChip, allOperadores] = await Promise.all([
      this.masterDataEstadoChipRepository.find(),
      this.masterDataOperadoresRepository.find(),
    ]);
    const defaultEstadoChipId = allEstadosChip[0]?.id_estadoChip ?? null;
    const defaultOperadorId = allOperadores[0]?.id_operador ?? null;
    if (!defaultEstadoChipId || !defaultOperadorId) {
      warnings.push(
        'No hay catálogo de estado u operador de chip; no se pueden crear chips desde el Excel de celulares.',
      );
      return 0;
    }

    const pending = new Map<
      string,
      { operadorText?: string | null }
    >();

    for (const { item } of rows) {
      const iccid = item.ICCID?.trim();
      if (!iccid) continue;
      if (chipsByIccid.has(iccid)) continue;
      if (!pending.has(iccid)) {
        pending.set(iccid, { operadorText: item.OPERADOR ?? null });
      }
    }

    if (pending.size === 0) return 0;

    const usedIccids = new Set(chipsByIccid.keys());
    let createdCount = 0;

    for (const [iccid, meta] of pending) {
      let operadorId = defaultOperadorId;
      if (meta.operadorText) {
        const hit = allOperadores.find(
          (o) =>
            normalizeLookupValue(o.nombre_operador) ===
            normalizeLookupValue(meta.operadorText!),
        );
        if (hit) operadorId = hit.id_operador;
      }

      let numero = this.deriveChipNumeroFromIccid(iccid, chipsByNumero);
      let iccidToSave = this.truncateValue(iccid, 25) || iccid;
      if (usedIccids.has(iccidToSave)) {
        iccidToSave = `${iccidToSave.slice(0, 20)}${createdCount}`.slice(0, 25);
      }
      usedIccids.add(iccidToSave);

      try {
        const saved = await this.moduleChipsRepository.save(
          this.moduleChipsRepository.create({
            numero_chip: numero,
            iccid: iccidToSave,
            estado_chip: defaultEstadoChipId,
            operador: operadorId,
            ticket: '',
            observacion: 'Creado al importar Excel de celulares',
            correo_electronico: '',
            fecha_registro: new Date(),
            activo: true,
          }),
        );
        const iccidKey = saved.iccid?.trim();
        if (iccidKey) chipsByIccid.set(iccidKey, saved.id_chip);
        const numKey = saved.numero_chip?.replace(/\D/g, '') ?? numero;
        if (numKey) chipsByNumero.set(numKey, saved.id_chip);
        createdCount += 1;
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : 'Error al crear chip';
        warnings.push(`ICCID ${iccid}: ${msg}`);
      }
    }

    return createdCount;
  }

  private deriveChipNumeroFromIccid(
    iccid: string,
    chipsByNumero: Map<string, number>,
  ): string {
    const digits = iccid.replace(/\D/g, '');
    let candidate =
      digits.length >= 9 ? digits.slice(-9) : digits.padStart(9, '0');
    if (candidate.length !== 9) {
      candidate = digits.slice(0, 9).padEnd(9, '0');
    }
    if (!chipsByNumero.has(candidate)) return candidate;
    for (let i = 1; i < 1000; i++) {
      const alt = String(parseInt(candidate, 10) + i).padStart(9, '0').slice(-9);
      if (!chipsByNumero.has(alt)) return alt;
    }
    return candidate;
  }

  private buildCelularPayloadFromExcelRow(
    item: CelularExcelRow,
    imei: string,
    excelRow: number,
    allEstadoCelular: MasterDataEstadoEquipo[],
    allAsignacion: MasterDataAsignacion[],
    allAreas: MarterDataArea[],
    allColaboradores: MasterDataColaborador[],
    chipsByIccid: Map<string, number>,
    warnings: string[],
    existingCelular?: ModuleCelulare,
  ): DeepPartial<ModuleCelulare> {
    const estadoCelularText = this.resolveCelularEstadoCelularText(item);
    const estadoEquipoText = this.resolveCelularEstadoEquipoText(item);

    const estadoCelularId = this.resolveEstadoModemId(
      estadoCelularText,
      allEstadoCelular,
      excelRow,
      warnings,
    );
    const estadoEquipoId = this.resolveEstadoEquipoId(
      estadoEquipoText,
      allAsignacion,
      excelRow,
      warnings,
    );
    const areaId = this.resolveAreaId(item.AREA, allAreas, excelRow, warnings);
    const colaboradorId = this.resolveColaboradorId(
      item.USUARIO,
      allColaboradores,
      excelRow,
      warnings,
    );
    const chipId = this.resolveChipIdByIccid(
      item.ICCID,
      chipsByIccid,
      excelRow,
      warnings,
    );

    const marcaExcel = this.getCelularMarcaModeloFromExcel(item, 'MARCA');
    const modeloExcel = this.getCelularMarcaModeloFromExcel(item, 'MODELO');

    return {
      marca: this.resolveCelularTextFromExcel(
        marcaExcel,
        existingCelular?.marca,
        50,
      ),
      modelo: this.resolveCelularTextFromExcel(
        modeloExcel,
        existingCelular?.modelo,
        50,
      ),
      imei_celular: imei,
      estado_celular: this.coalesceFkOnUpdate(
        estadoCelularText,
        estadoCelularId,
        existingCelular?.estado_celular,
      ),
      estado_equipo: this.coalesceFkOnUpdate(
        estadoEquipoText,
        estadoEquipoId,
        existingCelular?.estado_equipo,
      ),
      id_area: this.coalesceFkOnUpdate(item.AREA, areaId, existingCelular?.id_area),
      usuario: this.coalesceFkOnUpdate(
        item.USUARIO,
        colaboradorId,
        existingCelular?.usuario,
      ),
      numero_chip: this.coalesceFkOnUpdate(
        item.ICCID,
        chipId,
        existingCelular?.numero_chip,
      ),
      ticket: this.resolveCelularTextFromExcel(
        item.TICKET,
        existingCelular?.ticket,
        255,
      ),
      correo_electronico: this.resolveCelularTextFromExcel(
        item.EMAIL,
        existingCelular?.correo_electronico,
        255,
      ),
      observacion: this.resolveCelularTextFromExcel(
        item.OBSERVACIONES,
        existingCelular?.observacion,
        255,
      ),
    };
  }

  private resolveCelularEstadoCelularText(
    item: CelularExcelRow,
  ): string | null | undefined {
    const direct = item['ESTADO CELULAR']?.trim();
    if (direct) return direct;
    const combo = item.ESTADO?.trim();
    if (!combo) return null;
    const norm = normalizeLookupValue(combo);
    if (norm === 'OPERATIVO' || norm === 'INOPERATIVO') return combo;
    return null;
  }

  private resolveCelularEstadoEquipoText(
    item: CelularExcelRow,
  ): string | null | undefined {
    const direct = item['ESTADO EQUIPO']?.trim();
    if (direct) return direct;
    const combo = item.ESTADO?.trim();
    if (!combo) return null;
    const norm = normalizeLookupValue(combo);
    const asignacionKeys = new Set([
      'ASIGNADO',
      'ALMACEN TI',
      'ALMACEN DE TI',
      'STOCK',
      'NO UBICADO',
    ]);
    if (asignacionKeys.has(norm)) return combo;
    return null;
  }

  private resolveChipIdByIccid(
    value: string | null | undefined,
    chipsByIccid: Map<string, number>,
    excelRow: number,
    warnings: string[],
  ): number | null {
    if (!value) return null;
    const trimmed = value.trim();
    const chipId = chipsByIccid.get(trimmed);
    if (!chipId) {
      warnings.push(
        `Fila ${excelRow}: ICCID "${value}" no se pudo vincular (revise catálogo chips)`,
      );
      return null;
    }
    return chipId;
  }

  /** Si el Excel trae EQUIPO-MARCA / EQUIPO-MODELO, forzar guardado en BD aunque antes estuviera vacío. */
  /** Lee MARCA/MODELO desde columnas canónicas o legacy EQUIPO-MARCA / EQUIPO-MODELO. */
  private getCelularMarcaModeloFromExcel(
    item: CelularExcelRow,
    field: 'MARCA' | 'MODELO',
  ): string | null | undefined {
    const canonical = item[field]?.trim();
    if (canonical) return canonical;
    const legacyKey = field === 'MARCA' ? 'EQUIPO-MARCA' : 'EQUIPO-MODELO';
    const legacy = (item as CelularExcelRow & Record<string, string | null>)[
      legacyKey
    ]?.trim();
    return legacy || null;
  }

  private celularMustFixCorreoTicket(
    item: CelularExcelRow,
    existing: ModuleCelulare,
    next: DeepPartial<ModuleCelulare>,
  ): boolean {
    const excelEmail = item.EMAIL?.trim();
    const excelTicket = item.TICKET?.trim();
    if (excelEmail) {
      const db = (existing.correo_electronico ?? '').trim();
      const nx = String(next.correo_electronico ?? '').trim();
      if (db !== nx) return true;
    }
    if (excelTicket) {
      const db = (existing.ticket ?? '').trim();
      const nx = String(next.ticket ?? '').trim();
      if (db !== nx) return true;
    }
    return false;
  }

  /**
   * Si el Excel trae tikets / correo / observación, sincronizar aunque otros campos no cambien.
   */
  private celularMustForceExcelTextSync(
    item: CelularExcelRow,
    existing: ModuleCelulare,
    next: DeepPartial<ModuleCelulare>,
  ): boolean {
    const pairs: Array<{
      excel: string | null | undefined;
      db: string | null | undefined;
      nx: unknown;
    }> = [
      {
        excel: item.EMAIL,
        db: existing.correo_electronico,
        nx: next.correo_electronico,
      },
      {
        excel: item.TICKET,
        db: existing.ticket,
        nx: next.ticket,
      },
      {
        excel: item.OBSERVACIONES,
        db: existing.observacion,
        nx: next.observacion,
      },
    ];
    for (const { excel, db, nx } of pairs) {
      const excelText = excel?.trim();
      if (!excelText) continue;
      if ((db ?? '').trim() !== String(nx ?? '').trim()) return true;
    }
    return false;
  }

  private celularMustFixObservacion(
    item: CelularExcelRow,
    existing: ModuleCelulare,
    next: DeepPartial<ModuleCelulare>,
  ): boolean {
    const excelObs = item.OBSERVACIONES?.trim();
    if (!excelObs) return false;
    const db = (existing.observacion ?? '').trim();
    const nx = String(next.observacion ?? '').trim();
    return db !== nx;
  }

  private celularMustFixMarcaModelo(
    item: CelularExcelRow,
    existing: ModuleCelulare,
    next: DeepPartial<ModuleCelulare>,
  ): boolean {
    const excelMarca = this.getCelularMarcaModeloFromExcel(item, 'MARCA')?.trim();
    const excelModelo = this.getCelularMarcaModeloFromExcel(item, 'MODELO')?.trim();
    if (excelMarca) {
      const dbMarca = (existing.marca ?? '').trim();
      const nextMarca = String(next.marca ?? '').trim();
      if (dbMarca !== nextMarca) return true;
    }
    if (excelModelo) {
      const dbModelo = (existing.modelo ?? '').trim();
      const nextModelo = String(next.modelo ?? '').trim();
      if (dbModelo !== nextModelo) return true;
    }
    return false;
  }

  private resolveCelularTextFromExcel(
    excelValue: string | null | undefined,
    existing: string | null | undefined,
    maxLength: number,
  ): string {
    const fromExcel = excelValue?.trim();
    if (fromExcel) {
      return this.truncateValue(fromExcel, maxLength);
    }
    const fromDb = existing?.trim();
    if (fromDb) {
      return this.truncateValue(fromDb, maxLength);
    }
    return '';
  }

  private celularPayloadHasChanges(
    existing: ModuleCelulare,
    next: DeepPartial<ModuleCelulare>,
  ): boolean {
    const norm = (v: unknown) => (v === undefined || v === '' ? null : v);
    return (
      norm(existing.marca) !== norm(next.marca) ||
      norm(existing.modelo) !== norm(next.modelo) ||
      norm(existing.estado_celular) !== norm(next.estado_celular) ||
      norm(existing.estado_equipo) !== norm(next.estado_equipo) ||
      norm(existing.id_area) !== norm(next.id_area) ||
      norm(existing.usuario) !== norm(next.usuario) ||
      norm(existing.numero_chip) !== norm(next.numero_chip) ||
      norm(existing.ticket) !== norm(next.ticket) ||
      norm(existing.correo_electronico) !== norm(next.correo_electronico) ||
      norm(existing.observacion) !== norm(next.observacion)
    );
  }

  async processExcelLaptos(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo');
    }
    const extension = file.originalname.split('.').pop()?.toLowerCase() ?? '';
    const mimetype = file.mimetype.toLowerCase();
    if (
      !this.allowedExtensions.has(extension) &&
      !this.allowedMimeTypes.has(mimetype)
    ) {
      throw new BadRequestException(
        'El archivo debe ser Excel válido (.xlsx, .xlsm, .xltx, .xltm)',
      );
    }

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.buffer as any);
      if (!workbook.worksheets.length) {
        throw new BadRequestException('El archivo Excel no contiene hojas');
      }

      const source = resolveLaptopExcelSource(workbook);
      if (!source) {
        throw new BadRequestException(
          'No se encontró encabezado de PCs/laptops. El Excel debe tener columnas como en laptos.xlsx: HOST (serie), TIPO, MARCA, Modelo, STATUS, AREA, USUARIO, Ubicación, Observación, Anexo, TICKET. Reinicie el backend si ve un mensaje antiguo que pide columna SERIE.',
        );
      }

      const parsedRows = parseLaptopExcelWorksheet(
        source.worksheet,
        source.headerRowNumber,
      );
      const insertSummary = await this.insertDataDBLaptos(parsedRows);

      return {
        success: true,
        message: `Archivo de PCs/laptops procesado. Nuevos: ${insertSummary.inserted}, actualizados: ${insertSummary.updated}, sin cambios: ${insertSummary.unchanged}, sin SERIE: ${insertSummary.skippedWithoutSerie}.`,
        totalRows: parsedRows.length,
        result: [insertSummary],
        summary: insertSummary,
        headers: [...LAPTOP_EXCEL_HEADERS],
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        `Error al procesar el archivo de PCs/laptops: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /** Fila donde aparecen encabezados SERIE + MARCA (plantilla inventario monitores). */
  private findMonitoresHeaderRowNumber(
    worksheet: ExcelJS.Worksheet,
  ): number | null {
    let found: number | null = null;
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (found !== null) return;
      let hasSerie = false;
      let hasMarca = false;
      row.eachCell({ includeEmpty: false }, (cell) => {
        const h = this.getCellString(cell.value);
        if (!h) return;
        const n = this.normalizeHeader(h);
        if (n === 'SERIE') hasSerie = true;
        if (n === 'MARCA') hasMarca = true;
      });
      if (hasSerie && hasMarca) {
        found = rowNumber;
      }
    });
    return found;
  }

  async processExcelMonitores(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo');
    }
    const extension = file.originalname.split('.').pop()?.toLowerCase() ?? '';
    const mimetype = file.mimetype.toLowerCase();
    if (
      !this.allowedExtensions.has(extension) &&
      !this.allowedMimeTypes.has(mimetype)
    ) {
      throw new BadRequestException(
        'El archivo debe ser Excel válido (.xlsx, .xlsm, .xltx, .xltm)',
      );
    }

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.buffer as any);
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new BadRequestException('El archivo Excel no contiene hojas');
      }

      const headerRowNumber = this.findMonitoresHeaderRowNumber(worksheet);
      if (headerRowNumber === null) {
        throw new BadRequestException(
          'No se encontró encabezado de monitores (columnas SERIE y MARCA).',
        );
      }

      const headers: string[] = [];
      worksheet.getRow(headerRowNumber).eachCell((cell, colNumber) => {
        const h = this.getCellString(cell.value);
        headers[colNumber] = h ? this.normalizeHeader(h) : '';
      });

      const rows: Array<{
        excelRow: number;
        item: Record<string, ExcelJS.CellValue>;
      }> = [];

      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber <= headerRowNumber) return;

        const rowData: Record<string, ExcelJS.CellValue> = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber];
          if (!header) return;
          rowData[header] = cell.value;
        });
        rows.push({ excelRow: rowNumber, item: rowData });
      });

      const insertSummary = await this.insertDataDBMonitores(rows);

      return {
        success: true,
        message: `Archivo de monitores procesado. Nuevos: ${insertSummary.inserted}, existentes: ${insertSummary.existing}, sin SERIE: ${insertSummary.skippedWithoutSerie}, errores: ${insertSummary.skippedByError}.`,
        totalRows: rows.length,
        summary: insertSummary,
        headers: this.allowedHeadersMonitores,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        `Error al procesar el archivo de monitores: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async insertDataDBMonitores(
    rows: Array<{ excelRow: number; item: Record<string, ExcelJS.CellValue> }>,
  ): Promise<{
    inserted: number;
    existing: number;
    skippedWithoutSerie: number;
    skippedByError: number;
    errors: string[];
  }> {
    let inserted = 0;
    let existing = 0;
    let skippedWithoutSerie = 0;
    let skippedByError = 0;
    const errors: string[] = [];

    const [allAreas, allAsignacion, allEstadoMonitor, allColaboradores] =
      await Promise.all([
        this.marterDataAreaRepository.find(),
        this.masterDataAsignacionRepository.find(),
        this.masterDataEstadoEquipoRepository.find(),
        this.masterDataColaboradorRepository.find(),
      ]);

    const seenSerieInFile = new Set<string>();

    for (const { excelRow, item } of rows) {
      const serieRaw = this.getExcelField(item, 'SERIE');
      const serieTrimmed = serieRaw?.trim().replace(/\s+/g, ' ') ?? '';
      const serieNorm = serieTrimmed ? this.truncateValue(serieTrimmed, 60) : '';
      const serieNormalized = serieNorm.trim();
      if (!serieNormalized) {
        skippedWithoutSerie += 1;
        continue;
      }

      if (seenSerieInFile.has(serieNormalized)) {
        existing += 1;
        errors.push(
          `Fila ${excelRow}: SERIE duplicada en el archivo "${serieNormalized}"`,
        );
        continue;
      }

      const existe = await this.moduleMonitoresRepository.findOne({
        where: { serie: serieNormalized },
        select: ['id_monitor'],
      });
      if (existe) {
        existing += 1;
        seenSerieInFile.add(serieNormalized);
        continue;
      }

      const marca =
        this.truncateValue(this.getExcelField(item, 'MARCA'), 50) || 'S/D';
      const modelo =
        this.truncateValue(this.getExcelField(item, 'MODELO'), 50) || 'S/D';

      const estadoText = this.getExcelField(item, 'ESTADO');
      const statusText = this.getExcelField(item, 'STATUS', 'STATUTS');
      const areaText = this.getExcelField(item, 'AREA');
      const usuarioText = this.getExcelField(item, 'USUARIO');

      let estado_monitor_id =
        estadoText === null ? null : await this.findEstadoModemId(estadoText);
      if (!estado_monitor_id && estadoText) {
        const target = this.normalizeValue(estadoText);
        const hitEstado = allEstadoMonitor.find(
          (x) => target === this.normalizeValue(x.descripcion),
        );
        estado_monitor_id = hitEstado?.id_estado ?? null;
      }

      let status_monitor_id =
        statusText === null ? null : await this.findEstadoEquipoId(statusText);
      if (!status_monitor_id && statusText) {
        const targetStatus = this.normalizeValue(statusText);
        const hitStatus = allAsignacion.find(
          (x) => targetStatus === this.normalizeValue(x.descripcion),
        );
        status_monitor_id = hitStatus?.id_asignado ?? null;
      }

      let id_area = await this.findAreaId(areaText);
      if (!id_area && areaText) {
        const targetArea = this.normalizeValue(areaText);
        const hitArea = allAreas.find(
          (a) => targetArea === this.normalizeValue(a.nombre_area),
        );
        id_area = hitArea?.id_area ?? null;
      }

      let usuario = await this.findColaboradorId(usuarioText);
      if (!usuario && usuarioText) {
        const targetUsuario = this.normalizeValue(usuarioText);
        const hitUsuario = allColaboradores.find(
          (c) => targetUsuario === this.normalizeValue(c.nombre_completo),
        );
        usuario = hitUsuario?.id_colaborador ?? null;
      }

      const monitorData: DeepPartial<ModuleMonitore> = {
        serie: serieNormalized,
        marca,
        modelo,
        estado_monitor: estado_monitor_id,
        status_monitor: status_monitor_id,
        id_area,
        usuario,
        ubicacion: null,
        observaciones:
          this.truncateValue(
            this.getExcelField(item, 'OBSERVACION', 'OBSERVACIONES'),
            255,
          ) || null,
        anexo: this.parseAnexoInt(this.getExcelField(item, 'ANEXO')),
        fecha_registro: new Date(),
        activo: true,
      };

      try {
        const monitor = this.moduleMonitoresRepository.create(monitorData);
        await this.moduleMonitoresRepository.save(monitor);
        inserted += 1;
        seenSerieInFile.add(serieNormalized);
      } catch (error) {
        skippedByError += 1;
        const message =
          error instanceof Error ? error.message : 'Error desconocido al guardar';
        errors.push(`Fila ${excelRow}: ${message}`);
      }
    }

    return {
      inserted,
      existing,
      skippedWithoutSerie,
      skippedByError,
      errors: errors.slice(0, 50),
    };
  }

  async processExcelTablets(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo');
    }
    const extension = file.originalname.split('.').pop()?.toLowerCase() ?? '';
    const mimetype = file.mimetype.toLowerCase();
    if (
      !this.allowedExtensions.has(extension) &&
      !this.allowedMimeTypes.has(mimetype)
    ) {
      throw new BadRequestException(
        'El archivo debe ser Excel válido (.xlsx, .xlsm, .xltx, .xltm)',
      );
    }

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.buffer as any);
      if (!workbook.worksheets.length) {
        throw new BadRequestException('El archivo Excel no contiene hojas');
      }

      const source = resolveTabletExcelSource(workbook);
      if (!source) {
        throw new BadRequestException(
          'No se encontró encabezado de tablets. El Excel debe tener columnas como en tablets.xlsx: AREA, MARCA, MODELO, IMEI, ESTADO OPERATIVO, ESTADO DEL EQUIPO, ICCID, Obs1, #Ticket.',
        );
      }

      const parsedRows = parseTabletExcelWorksheet(
        source.worksheet,
        source.headerRowNumber,
      );
      const insertSummary = await this.insertDataDBTablets(parsedRows);

      return {
        success: true,
        message: `Archivo de tablets procesado. Nuevos: ${insertSummary.inserted}, actualizados: ${insertSummary.updated}, sin cambios: ${insertSummary.unchanged}, sin IMEI: ${insertSummary.skippedWithoutImei}. Con estado tablet (ID): ${insertSummary.estadoTabletResolved ?? 0}, con estado equipo (ID): ${insertSummary.estadoEquipoResolved ?? 0}, con ubicación (ID): ${insertSummary.ubicacionResolved ?? 0}.`,
        totalRows: parsedRows.length,
        result: [insertSummary],
        summary: {
          ...insertSummary,
          importVersion: 'tablets-catalog-fk-v3',
        },
        headers: [...TABLET_EXCEL_HEADERS],
        importVersion: 'tablets-catalog-fk-v3',
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        `Error al procesar el archivo de tablets: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async insertDataDBTablets(
    dataInsert: ParsedTabletExcelRow[],
  ): Promise<{
    inserted: number;
    updated: number;
    unchanged: number;
    duplicateInFile: number;
    skippedWithoutImei: number;
    estadoTabletResolved: number;
    estadoEquipoResolved: number;
    ubicacionResolved: number;
    importVersion: string;
    warnings: string[];
  }> {
    const imeisFromFile = dataInsert
      .map((row) => {
        const raw = getTabletImeiFromExcelItem(row.item);
        return raw ? this.truncateValue(raw, 50).trim() : '';
      })
      .filter((s): s is string => Boolean(s));

    const uniqueImeis = [...new Set(imeisFromFile)];
    const existingTablets = uniqueImeis.length
      ? await this.moduleTabletRepository.find({
          where: { imei_tablet: In(uniqueImeis) },
        })
      : [];

    const existingByImei = new Map(
      existingTablets
        .filter((t) => t.imei_tablet)
        .map((t) => [t.imei_tablet as string, t]),
    );

    const [allAreas, allAsignacion, allEstadoTablet, allUbicaciones, allChips] =
      await Promise.all([
        this.marterDataAreaRepository.find(),
        this.masterDataAsignacionRepository.find(),
        this.masterDataEstadoEquipoRepository.find(),
        this.masterDataUbicacionRepository.find(),
        this.moduleChipsRepository.find({
          select: ['id_chip', 'iccid', 'numero_chip'],
        }),
      ]);

    for (const seed of ['OPERATIVO', 'INOPERATIVO']) {
      await this.ensureEstadoOperativoCatalogId(seed, allEstadoTablet);
    }
    for (const seed of [
      'STOCK',
      'NO UBICADO',
      'MALOGRADO',
      'PATRIMONIAL',
      'ROBADO',
      'USADO',
    ]) {
      await this.ensureAsignacionCatalogId(seed, allAsignacion);
    }

    const chipsByIccid = new Map<string, number>();
    const chipsByNumero = new Map<string, number>();
    for (const chip of allChips) {
      const iccid = chip.iccid?.trim();
      if (iccid) chipsByIccid.set(iccid, chip.id_chip);
      if (chip.numero_chip) {
        const key = chip.numero_chip.replace(/\D/g, '');
        if (key) chipsByNumero.set(key, chip.id_chip);
      }
    }

    const warnings: string[] = [];
    const seenInCurrentFile = new Set<string>();
    let inserted = 0;
    let updated = 0;
    let unchanged = 0;
    let duplicateInFile = 0;
    let skippedWithoutImei = 0;
    const toInsert: ModuleTablet[] = [];
    const toUpdate: ModuleTablet[] = [];
    const fkPatches: {
      imei_tablet: string;
      estado_tablet: number | null;
      estado_equipo: number | null;
      ubicacion: number | null;
      id_area: number | null;
    }[] = [];

    for (const { excelRow, item: rawItem } of dataInsert) {
      const item = repairTabletExcelRow(rawItem);
      let imei = getTabletImeiFromExcelItem(item);
      if (!imei && item.EXCEL_ID?.trim()) {
        imei = `EXCEL-ID-${item.EXCEL_ID.trim()}`;
      }
      imei = imei ? this.truncateValue(imei, 50).trim() : '';
      if (!imei) {
        skippedWithoutImei += 1;
        continue;
      }

      if (seenInCurrentFile.has(imei)) {
        duplicateInFile += 1;
        warnings.push(`Fila ${excelRow}: IMEI duplicado en el archivo "${imei}"`);
        continue;
      }
      seenInCurrentFile.add(imei);

      const existingTablet = existingByImei.get(imei);
      const payload = await this.buildTabletPayloadFromExcelRow(
        item,
        imei,
        allEstadoTablet,
        allAsignacion,
        allAreas,
        allUbicaciones,
        chipsByIccid,
        chipsByNumero,
        excelRow,
        warnings,
        existingTablet,
      );

      const ubicacionForPatch =
        payload.ubicacion ??
        (await this.ensureUbicacionCatalogId(item.UBICACION, allUbicaciones));

      if (
        payload.estado_tablet != null ||
        payload.estado_equipo != null ||
        ubicacionForPatch != null ||
        payload.id_area != null
      ) {
        fkPatches.push({
          imei_tablet: imei,
          estado_tablet: payload.estado_tablet ?? null,
          estado_equipo: payload.estado_equipo ?? null,
          ubicacion: ubicacionForPatch,
          id_area: payload.id_area ?? null,
        });
      }

      if (existingTablet?.id_tablet) {
        const nextActivo = parseTabletActivoFromExcel(
          item,
          existingTablet.activo ?? true,
        );
        const needsFkFill = this.tabletNeedsFkFillFromExcel(
          existingTablet,
          payload,
          item,
        );
        if (
          !needsFkFill &&
          !this.tabletPayloadHasChanges(existingTablet, payload) &&
          Boolean(existingTablet.activo ?? true) === nextActivo
        ) {
          unchanged += 1;
          continue;
        }
        toUpdate.push(
          this.moduleTabletRepository.create({
            id_tablet: existingTablet.id_tablet,
            ...payload,
            fecha_registro: existingTablet.fecha_registro,
            activo: nextActivo,
          }),
        );
        updated += 1;
        continue;
      }

      toInsert.push(
        this.moduleTabletRepository.create({
          ...payload,
          fecha_registro: new Date(),
          activo: parseTabletActivoFromExcel(item, true),
        }),
      );
      inserted += 1;
    }

    const BATCH = 80;
    try {
      for (let i = 0; i < toInsert.length; i += BATCH) {
        await this.moduleTabletRepository.save(toInsert.slice(i, i + BATCH));
      }
      for (let i = 0; i < toUpdate.length; i += BATCH) {
        await this.moduleTabletRepository.save(toUpdate.slice(i, i + BATCH));
      }

      await this.persistTabletCatalogFkByImei(fkPatches);

      if ((inserted > 0 || updated > 0) && fkPatches.length === 0) {
        warnings.unshift(
          'Ninguna fila recibió IDs de ESTADO OPERATIVO / ESTADO DEL EQUIPO / UBICACIÓN. Cierre el backend, ejecute npm run build y reinicie el servidor.',
        );
      }
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : 'Error al guardar en base de datos';
      throw new BadRequestException(
        `No se pudieron crear/actualizar tablets: ${msg}`,
      );
    }

    const estadoTabletResolved = fkPatches.filter(
      (p) => p.estado_tablet != null,
    ).length;
    const estadoEquipoResolved = fkPatches.filter(
      (p) => p.estado_equipo != null,
    ).length;
    const ubicacionResolved = fkPatches.filter((p) => p.ubicacion != null).length;

    return {
      inserted,
      updated,
      unchanged,
      duplicateInFile,
      skippedWithoutImei,
      estadoTabletResolved,
      estadoEquipoResolved,
      ubicacionResolved,
      importVersion: 'tablets-catalog-fk-v3',
      warnings: warnings.slice(0, 50),
    };
  }

  /**
   * Segundo paso: UPDATE explícito por IMEI (estado_tablet, estado_equipo, ubicacion).
   * Garantiza que los IDs de catálogo queden en BD aunque el save por lote no los persista.
   */
  private async persistTabletCatalogFkByImei(
    patches: {
      imei_tablet: string;
      estado_tablet: number | null;
      estado_equipo: number | null;
      ubicacion: number | null;
      id_area: number | null;
    }[],
  ): Promise<void> {
    for (const patch of patches) {
      const sets: string[] = [];
      const params: (string | number)[] = [];
      let idx = 0;
      if (patch.estado_tablet != null) {
        sets.push(`estado_tablet = @${idx}`);
        params.push(patch.estado_tablet);
        idx += 1;
      }
      if (patch.estado_equipo != null) {
        sets.push(`estado_equipo = @${idx}`);
        params.push(patch.estado_equipo);
        idx += 1;
      }
      if (patch.ubicacion != null) {
        sets.push(`ubicacion = @${idx}`);
        params.push(patch.ubicacion);
        idx += 1;
      }
      if (patch.id_area != null) {
        sets.push(`id_area = @${idx}`);
        params.push(patch.id_area);
        idx += 1;
      }
      if (sets.length === 0) continue;
      params.push(patch.imei_tablet);
      await this.moduleTabletRepository.query(
        `UPDATE tablets SET ${sets.join(', ')} WHERE imei_tablet = @${idx}`,
        params,
      );
    }
  }

  private nextEstadoEquipoCatalogId(
    catalog: MasterDataEstadoEquipo[],
  ): number {
    return catalog.reduce((max, x) => Math.max(max, x.id_estado ?? 0), 0) + 1;
  }

  private nextAsignacionCatalogId(catalog: MasterDataAsignacion[]): number {
    return (
      catalog.reduce((max, x) => Math.max(max, x.id_asignado ?? 0), 0) + 1
    );
  }

  /** Excel UBICACIÓN → tablets.ubicacion (FK TBLM_ubicacion.id), igual que laptops. */
  private resolveUbicacionId(
    value: string | null | undefined,
    catalog: MasterDataUbicacion[],
    excelRow: number,
    warnings: string[],
  ): number | null {
    const mapped = mapTabletUbicacionText(value);
    if (!mapped) return null;
    const byId = parseNumericId(mapped);
    if (byId !== null && catalog.some((x) => x.id === byId)) {
      return byId;
    }
    const hit = findMasterCatalogMatch(mapped, catalog, (x) => x.descripcion);
    if (!hit) {
      warnings.push(
        `Fila ${excelRow}: UBICACIÓN "${value}" no está en TBLM_ubicacion`,
      );
      return null;
    }
    return hit.id;
  }

  private async ensureUbicacionCatalogId(
    value: string | null | undefined,
    catalog: MasterDataUbicacion[],
  ): Promise<number | null> {
    const mapped = mapTabletUbicacionText(value);
    if (!mapped) return null;
    const byId = parseNumericId(mapped);
    if (byId !== null && catalog.some((x) => x.id === byId)) {
      return byId;
    }
    const hit = findMasterCatalogMatch(mapped, catalog, (x) => x.descripcion);
    if (hit) return hit.id;
    const descripcion = mapped.trim().toUpperCase();
    const inserted = (await this.masterDataUbicacionRepository.query(
      'INSERT INTO TBLM_ubicacion (descripcion) OUTPUT INSERTED.id AS id VALUES (@0)',
      [descripcion],
    )) as { id: number }[];
    const id = inserted[0]?.id;
    if (id == null) return null;
    const saved: MasterDataUbicacion = { id, descripcion };
    catalog.push(saved);
    return id;
  }

  private async ensureEstadoOperativoCatalogId(
    value: string | null | undefined,
    catalog: MasterDataEstadoEquipo[],
  ): Promise<number | null> {
    const mapped = mapTabletEstadoOperativoText(value);
    if (!mapped) return null;
    const byId = parseNumericId(mapped);
    if (byId !== null && catalog.some((x) => x.id_estado === byId)) {
      return byId;
    }
    const hit = findMasterCatalogMatch(mapped, catalog, (x) => x.descripcion);
    if (hit) return hit.id_estado;
    const descripcion = mapped.trim().toUpperCase();
    const id_estado = this.nextEstadoEquipoCatalogId(catalog);
    await this.masterDataEstadoEquipoRepository.query(
      'INSERT INTO TBLM_estados_equipo (id_estado, descripcion) VALUES (@0, @1)',
      [id_estado, descripcion],
    );
    const saved: MasterDataEstadoEquipo = { id_estado, descripcion };
    catalog.push(saved);
    return id_estado;
  }

  private async ensureAsignacionCatalogId(
    value: string | null | undefined,
    catalog: MasterDataAsignacion[],
  ): Promise<number | null> {
    const mapped = mapTabletEstadoEquipoText(value);
    if (!mapped) return null;
    const byId = parseNumericId(mapped);
    if (byId !== null && catalog.some((x) => x.id_asignado === byId)) {
      return byId;
    }
    const hit = findMasterCatalogMatch(mapped, catalog, (x) => x.descripcion);
    if (hit) return hit.id_asignado;
    const descripcion = mapped.trim().toUpperCase();
    const id_asignado = this.nextAsignacionCatalogId(catalog);
    await this.masterDataAsignacionRepository.query(
      'INSERT INTO TBLM_asignacion (id_asignado, descripcion) VALUES (@0, @1)',
      [id_asignado, descripcion],
    );
    const saved: MasterDataAsignacion = { id_asignado, descripcion };
    catalog.push(saved);
    return id_asignado;
  }

  private async buildTabletPayloadFromExcelRow(
    item: TabletExcelRow,
    imei: string,
    allEstadoTablet: MasterDataEstadoEquipo[],
    allAsignacion: MasterDataAsignacion[],
    allAreas: MarterDataArea[],
    allUbicaciones: MasterDataUbicacion[],
    chipsByIccid: Map<string, number>,
    chipsByNumero: Map<string, number>,
    excelRow: number,
    warnings: string[],
    existing?: ModuleTablet,
  ): Promise<DeepPartial<ModuleTablet>> {
    let marca =
      this.truncateValue(item.MARCA?.trim() ?? null, 50) ||
      (existing?.marca ? this.truncateValue(existing.marca, 50) : '') ||
      'S/D';
    if (marca.includes('[object')) marca = 'S/D';

    let modelo =
      this.truncateValue(item.MODELO?.trim() ?? null, 80) ||
      (existing?.modelo ? this.truncateValue(existing.modelo, 80) : '') ||
      'S/D';

    const estadoOperativoExcel = item['ESTADO TABLET'];
    const estadoEquipoExcel = item['ESTADO EQUIPO'];
    const ubicacionExcel = item.UBICACION;
    const areaExcel = item.AREA;

    const estadoOperativoText =
      mapTabletEstadoOperativoText(estadoOperativoExcel) ?? estadoOperativoExcel;
    const estadoEquipoText =
      mapTabletEstadoEquipoText(estadoEquipoExcel) ?? estadoEquipoExcel;

    let estadoTabletId = this.resolveEstadoModemId(
      estadoOperativoText,
      allEstadoTablet,
      excelRow,
      warnings,
    );
    if (estadoTabletId == null && estadoOperativoText?.trim()) {
      estadoTabletId = await this.ensureEstadoOperativoCatalogId(
        estadoOperativoExcel,
        allEstadoTablet,
      );
    }

    let estadoEquipoId = this.resolveEstadoEquipoId(
      estadoEquipoText,
      allAsignacion,
      excelRow,
      warnings,
    );
    if (estadoEquipoId == null && estadoEquipoText?.trim()) {
      estadoEquipoId = await this.ensureAsignacionCatalogId(
        estadoEquipoExcel,
        allAsignacion,
      );
    }

    const areaId = this.resolveAreaId(areaExcel, allAreas, excelRow, warnings);

    let ubicacionId = this.resolveUbicacionId(
      ubicacionExcel,
      allUbicaciones,
      excelRow,
      warnings,
    );
    if (ubicacionId == null && mapTabletUbicacionText(ubicacionExcel)) {
      ubicacionId = await this.ensureUbicacionCatalogId(
        ubicacionExcel,
        allUbicaciones,
      );
    }

    let num_chips: number | null = existing?.num_chips ?? null;
    const iccidText = item.ICCID?.trim();
    if (isTabletIccidLinkable(iccidText)) {
      const chipId = this.resolveChipIdByIccid(
        iccidText,
        chipsByIccid,
        excelRow,
        warnings,
      );
      if (chipId != null) {
        num_chips = chipId;
      }
    } else if (item.NUMERO?.trim() && item.NUMERO.trim() !== '-') {
      const key = item.NUMERO.replace(/\D/g, '');
      if (key && chipsByNumero.has(key)) {
        num_chips = chipsByNumero.get(key) ?? num_chips;
      }
    }

    const ticketText = item.TICKET?.trim() ?? null;
    const observacionesText =
      this.truncateValue(getTabletObservacionFromExcel(item), 255) || null;

    const ticketValue = existing
      ? this.coalesceTextOnUpdate(ticketText, existing.ticket)
      : this.truncateValue(ticketText, 255) || null;

    return {
      marca,
      modelo,
      imei_tablet: imei,
      estado_tablet: existing
        ? this.coalesceFkOnUpdate(
            estadoOperativoExcel,
            estadoTabletId,
            existing.estado_tablet,
          )
        : (estadoTabletId ?? null),
      estado_equipo: existing
        ? this.coalesceFkOnUpdate(
            estadoEquipoExcel,
            estadoEquipoId,
            existing.estado_equipo,
          )
        : (estadoEquipoId ?? null),
      id_area: existing
        ? this.coalesceFkOnUpdate(areaExcel, areaId, existing.id_area)
        : (areaId ?? null),
      ubicacion: existing
        ? this.coalesceFkOnUpdate(ubicacionExcel, ubicacionId, existing.ubicacion)
        : (ubicacionId ?? null),
      ticket: ticketValue,
      observaciones: observacionesText,
      num_chips,
    };
  }

  /** Reimportar: BD con FK null pero Excel trae ESTADO/UBICACIÓN → forzar actualización. */
  private tabletNeedsFkFillFromExcel(
    existing: ModuleTablet,
    next: DeepPartial<ModuleTablet>,
    item: TabletExcelRow,
  ): boolean {
    if (item['ESTADO TABLET']?.trim() && existing.estado_tablet == null && next.estado_tablet != null) {
      return true;
    }
    if (item['ESTADO EQUIPO']?.trim() && existing.estado_equipo == null && next.estado_equipo != null) {
      return true;
    }
    if (item.UBICACION?.trim() && existing.ubicacion == null && next.ubicacion != null) {
      return true;
    }
    return false;
  }

  private tabletPayloadHasChanges(
    existing: ModuleTablet,
    next: DeepPartial<ModuleTablet>,
  ): boolean {
    const norm = (v: unknown) =>
      v == null || v === '' ? '' : String(v).trim().toUpperCase();

    return (
      norm(existing.marca) !== norm(next.marca) ||
      norm(existing.modelo) !== norm(next.modelo) ||
      (existing.estado_tablet ?? null) !== (next.estado_tablet ?? null) ||
      (existing.estado_equipo ?? null) !== (next.estado_equipo ?? null) ||
      (existing.id_area ?? null) !== (next.id_area ?? null) ||
      (existing.ubicacion ?? null) !== (next.ubicacion ?? null) ||
      norm(existing.ticket) !== norm(next.ticket) ||
      norm(existing.observaciones) !== norm(next.observaciones) ||
      (existing.num_chips ?? null) !== (next.num_chips ?? null)
    );
  }

  async insertDataDBLaptos(
    dataInsert: ParsedLaptopExcelRow[],
  ): Promise<{
    inserted: number;
    updated: number;
    unchanged: number;
    duplicateInFile: number;
    skippedWithoutSerie: number;
    warnings: string[];
  }> {
    const seriesFromFile = dataInsert
      .map((row) => {
        const raw = getLaptopSerieFromExcelItem(row.item);
        return raw ? this.truncateValue(raw, 60).trim() : '';
      })
      .filter((s): s is string => Boolean(s));

    const uniqueSeries = [...new Set(seriesFromFile)];
    const existingLaptops = uniqueSeries.length
      ? await this.laptoRepository.find({
          where: { serie: In(uniqueSeries) },
        })
      : [];

    const existingBySerie = new Map(
      existingLaptops
        .filter((p) => p.serie)
        .map((p) => [p.serie as string, p]),
    );

    const [allAreas, allAsignacion, allEstadoPc, allColaboradores, allUbicaciones] =
      await Promise.all([
        this.marterDataAreaRepository.find(),
        this.masterDataAsignacionRepository.find(),
        this.masterDataEstadoEquipoRepository.find(),
        this.masterDataColaboradorRepository.find(),
        this.masterDataUbicacionRepository.find(),
      ]);

    const warnings: string[] = [];
    const seenInCurrentFile = new Set<string>();
    let inserted = 0;
    let updated = 0;
    let unchanged = 0;
    let duplicateInFile = 0;
    let skippedWithoutSerie = 0;
    const toInsert: Lapto[] = [];
    const toUpdate: Lapto[] = [];

    for (const { excelRow, item: rawItem } of dataInsert) {
      const item = repairLaptopExcelRow(rawItem);
      /** Excel HOST → columna BD `serie` */
      let serieRaw = getLaptopSerieFromExcelItem(item);
      if (!serieRaw && item.EXCEL_ID?.trim()) {
        serieRaw = `EXCEL-ID-${item.EXCEL_ID.trim()}`;
      }
      if (!serieRaw && (item.MARCA?.trim() || item.MODELO?.trim())) {
        const parts = [
          item.TIPO?.trim(),
          item.MARCA?.trim(),
          item.MODELO?.trim(),
          `R${excelRow}`,
        ].filter(Boolean);
        serieRaw = parts.join('-');
      }
      const serie = serieRaw ? this.truncateValue(serieRaw, 60).trim() : '';
      if (!serie) {
        skippedWithoutSerie += 1;
        continue;
      }

      if (seenInCurrentFile.has(serie)) {
        duplicateInFile += 1;
        warnings.push(`Fila ${excelRow}: SERIE duplicada en el archivo "${serie}"`);
        continue;
      }
      seenInCurrentFile.add(serie);

      const existingLaptop = existingBySerie.get(serie);
      const payload = this.buildLaptopPayloadFromExcelRow(
        item,
        serie,
        allEstadoPc,
        allAsignacion,
        allAreas,
        allColaboradores,
        allUbicaciones,
        warnings,
        excelRow,
        existingLaptop,
      );

      if (existingLaptop?.id_pc) {
        const nextActivo = parseLaptopActivoFromExcel(
          item,
          existingLaptop.activo ?? true,
        );
        if (
          !this.laptopPayloadHasChanges(existingLaptop, payload) &&
          !this.laptopMustFixObservacion(existingLaptop, item) &&
          Boolean(existingLaptop.activo ?? true) === nextActivo
        ) {
          unchanged += 1;
          continue;
        }
        toUpdate.push(
          this.laptoRepository.create({
            id_pc: existingLaptop.id_pc,
            ...payload,
            fecha_registro: existingLaptop.fecha_registro,
            activo: nextActivo,
          }),
        );
        updated += 1;
        continue;
      }

      toInsert.push(
        this.laptoRepository.create({
          ...payload,
          fecha_registro: new Date(),
          activo: parseLaptopActivoFromExcel(item, true),
        }),
      );
      inserted += 1;
    }

    const BATCH = 80;
    try {
      for (let i = 0; i < toInsert.length; i += BATCH) {
        await this.laptoRepository.save(toInsert.slice(i, i + BATCH));
      }
      for (let i = 0; i < toUpdate.length; i += BATCH) {
        await this.laptoRepository.save(toUpdate.slice(i, i + BATCH));
      }
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : 'Error al guardar en base de datos';
      throw new BadRequestException(
        `No se pudieron crear/actualizar PCs/laptops: ${msg}`,
      );
    }

    return {
      inserted,
      updated,
      unchanged,
      duplicateInFile,
      skippedWithoutSerie,
      warnings: warnings.slice(0, 50),
    };
  }

  private buildLaptopPayloadFromExcelRow(
    item: LaptopExcelRow,
    serie: string,
    allEstadoPc: MasterDataEstadoEquipo[],
    allAsignacion: MasterDataAsignacion[],
    allAreas: MarterDataArea[],
    allColaboradores: MasterDataColaborador[],
    allUbicaciones: MasterDataUbicacion[],
    warnings: string[],
    excelRow: number,
    existing?: Lapto,
  ): DeepPartial<Lapto> {
    const tipoRaw = item.TIPO?.trim();
    const marcaRaw = item.MARCA?.trim();
    const modeloRaw = item.MODELO?.trim();

    let tipo_equipo =
      this.truncateValue(tipoRaw ?? null, 50) ||
      (existing?.tipo_equipo ? this.truncateValue(existing.tipo_equipo, 50) : '') ||
      'S/D';
    let marca =
      this.truncateValue(marcaRaw ?? null, 50) ||
      (existing?.marca ? this.truncateValue(existing.marca, 50) : '') ||
      'S/D';
    if (marca.includes('[object')) marca = 'S/D';

    let modelo =
      this.truncateValue(modeloRaw ?? null, 50) ||
      (existing?.modelo ? this.truncateValue(existing.modelo, 50) : '') ||
      'S/D';

    const estadoPcText = mapLaptopStatusToEstadoPcText(item['ESTADO PC']);
    const estadoEquipoText =
      mapLaptopStatusToEstadoEquipoText(item['ESTADO EQUIPO']) ??
      item['ESTADO EQUIPO'];

    const estadoPcHit = findMasterCatalogMatch(
      estadoPcText,
      allEstadoPc,
      (x) => x.descripcion,
    );
    const estadoEquipoHit = findMasterCatalogMatch(
      estadoEquipoText,
      allAsignacion,
      (x) => x.descripcion,
    );
    const areaHit = findMasterCatalogMatch(
      item.AREA,
      allAreas,
      (x) => x.nombre_area,
    );
    const colaboradorHit = findMasterCatalogMatch(
      item.USUARIO,
      allColaboradores,
      (x) => x.nombre_completo,
    );
    const ubicacionHit = findMasterCatalogMatch(
      item.UBICACION,
      allUbicaciones,
      (x) => x.descripcion,
    );

    const ticketText = item.TICKET?.trim() ?? null;
    const observacionesText =
      this.truncateValue(getLaptopObservacionFromExcel(item), 255) || null;

    const anexoParsed = item.ANEXO?.trim()
      ? this.parseAnexoInt(item.ANEXO)
      : null;

    const ticketValue = existing
      ? this.coalesceTextOnUpdate(ticketText, existing.ticket)
      : this.truncateValue(ticketText, 255) || null;

    /** Importación Excel: solo columna Observación (vacío limpia el campo). */
    const observacionesValue = observacionesText;

    return {
      tipo_equipo,
      marca,
      modelo,
      serie,
      estado_pc: estadoPcHit?.id_estado ?? existing?.estado_pc ?? null,
      estado_equipo:
        estadoEquipoHit?.id_asignado ?? existing?.estado_equipo ?? null,
      id_area: areaHit?.id_area ?? existing?.id_area ?? null,
      usuario:
        colaboradorHit?.id_colaborador ?? existing?.usuario ?? null,
      ubicacion: ubicacionHit?.id ?? existing?.ubicacion ?? null,
      ticket: ticketValue,
      observaciones: observacionesValue,
      anexo:
        anexoParsed != null ? anexoParsed : (existing?.anexo ?? null),
    };
  }

  /** Corrige observaciones legacy (mezclaban STATUS, AREA, etc.) → solo columna Observación. */
  private laptopMustFixObservacion(
    existing: Lapto,
    item: LaptopExcelRow,
  ): boolean {
    const next = (getLaptopObservacionFromExcel(item) ?? '').trim();
    const prev = (existing.observaciones ?? '').trim();
    if (prev === next) return false;
    if (/STATUS:|AREA:|VIGENCIA:|Estado equipo:|Patrimonial:|USUARIO:/i.test(prev)) {
      return true;
    }
    return prev !== next;
  }

  private laptopPayloadHasChanges(
    existing: Lapto,
    next: DeepPartial<Lapto>,
  ): boolean {
    const norm = (v: unknown) =>
      v == null || v === '' ? '' : String(v).trim().toUpperCase();

    return (
      norm(existing.tipo_equipo) !== norm(next.tipo_equipo) ||
      norm(existing.marca) !== norm(next.marca) ||
      norm(existing.modelo) !== norm(next.modelo) ||
      (existing.estado_pc ?? null) !== (next.estado_pc ?? null) ||
      (existing.estado_equipo ?? null) !== (next.estado_equipo ?? null) ||
      (existing.id_area ?? null) !== (next.id_area ?? null) ||
      (existing.usuario ?? null) !== (next.usuario ?? null) ||
      (existing.ubicacion ?? null) !== (next.ubicacion ?? null) ||
      norm(existing.ticket) !== norm(next.ticket) ||
      norm(existing.observaciones) !== norm(next.observaciones) ||
      (existing.anexo ?? null) !== (next.anexo ?? null)
    );
  }

  async processExcelChips(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo');
    }
    const extension = file.originalname.split('.').pop()?.toLowerCase() ?? '';
    const mimetype = file.mimetype.toLowerCase();
    if (
      !this.allowedExtensions.has(extension) &&
      !this.allowedMimeTypes.has(mimetype)
    ) {
      throw new BadRequestException(
        'El archivo debe ser Excel válido (.xlsx, .xlsm, .xltx, .xltm)',
      );
    }
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.buffer as any);
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new BadRequestException('El archivo Excel no contiene hojas');
      }

      if (findChipHeaderRowNumber(worksheet) === null) {
        throw new BadRequestException(
          `No se encontró encabezado de chips. Use las columnas: ${CHIP_EXCEL_HEADERS.join(', ')}`,
        );
      }

      const parsedRows = parseChipExcelWorksheet(worksheet);
      const insertSummary = await this.insertDataDBChips(parsedRows);

      return {
        success: true,
        message: `Archivo de chips procesado. Nuevos: ${insertSummary.inserted}, actualizados: ${insertSummary.updated}, sin cambios: ${insertSummary.unchanged}, sin número válido: ${insertSummary.skippedWithoutNumber}, catálogo inválido: ${insertSummary.skippedInvalidRequiredData}.`,
        totalRows: parsedRows.length,
        result: [insertSummary],
        summary: insertSummary,
        headers: [...CHIP_EXCEL_HEADERS],
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        `Error al procesar el archivo de chips: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async insertDataDBChips(
    dataInsert: ParsedChipExcelRow[],
  ): Promise<{
    inserted: number;
    updated: number;
    unchanged: number;
    duplicateInFile: number;
    skippedWithoutNumber: number;
    skippedInvalidRequiredData: number;
    warnings: string[];
  }> {
    const numerosFromFile = dataInsert
      .map((row) => this.normalizeChipNumero(row.item.NUMERO))
      .filter((n): n is string => Boolean(n));

    const uniqueNumeros = [...new Set(numerosFromFile)];
    const existingChips = uniqueNumeros.length
      ? await this.moduleChipsRepository.find({
          where: { numero_chip: In(uniqueNumeros) },
        })
      : [];

    const existingByNumero = new Map<string, EntityMoculesChips>();
    for (const chip of existingChips) {
      if (!chip.numero_chip) continue;
      const key = chip.numero_chip.replace(/\D/g, '') || chip.numero_chip.trim();
      existingByNumero.set(key, chip);
    }

    const [
      allEstadosChip,
      allOperadores,
      allTiposChip,
      allAreas,
      allColaboradores,
    ] = await Promise.all([
      this.masterDataEstadoChipRepository.find(),
      this.masterDataOperadoresRepository.find(),
      this.masterDataTipoChipRepository.find(),
      this.marterDataAreaRepository.find(),
      this.masterDataColaboradorRepository.find(),
    ]);

    const defaultEstadoChipId = allEstadosChip[0]?.id_estadoChip ?? null;
    const defaultOperadorId = allOperadores[0]?.id_operador ?? null;

    const usedIccids = new Set(
      (
        await this.moduleChipsRepository.find({
          select: ['iccid'],
        })
      )
        .map((c) => c.iccid?.trim())
        .filter((v): v is string => Boolean(v)),
    );

    const seenInCurrentFile = new Set<string>();
    let inserted = 0;
    let updated = 0;
    let unchanged = 0;
    let duplicateInFile = 0;
    let skippedWithoutNumber = 0;
    let skippedInvalidRequiredData = 0;
    const warnings: string[] = [];
    const toInsert: EntityMoculesChips[] = [];
    const toUpdate: EntityMoculesChips[] = [];

    for (const { excelRow, item: rawItem } of dataInsert) {
      const item = repairChipExcelRow(rawItem);
      const numero = this.normalizeChipNumero(item.NUMERO);
      if (!numero) {
        skippedWithoutNumber += 1;
        warnings.push(
          `Fila ${excelRow}: NUMERO inválido "${item.NUMERO ?? ''}" (debe tener 9 dígitos)`,
        );
        continue;
      }

      if (seenInCurrentFile.has(numero)) {
        duplicateInFile += 1;
        warnings.push(
          `Fila ${excelRow}: NUMERO duplicado en el archivo "${numero}"`,
        );
        continue;
      }
      seenInCurrentFile.add(numero);

      const existingChip = existingByNumero.get(numero);
      const chipPayload = this.buildChipPayloadFromExcelRow(
        item,
        numero,
        excelRow,
        allEstadosChip,
        allOperadores,
        allTiposChip,
        allAreas,
        allColaboradores,
        defaultEstadoChipId,
        defaultOperadorId,
        warnings,
        existingChip,
      );

      if (!chipPayload.estado_chip || !chipPayload.operador) {
        skippedInvalidRequiredData += 1;
        continue;
      }

      if (chipPayload.iccid) {
        const iccidKey = String(chipPayload.iccid).trim();
        const ownIccid = existingChip?.iccid?.trim();
        if (usedIccids.has(iccidKey) && iccidKey !== ownIccid) {
          chipPayload.iccid = numero;
        }
        usedIccids.add(String(chipPayload.iccid).trim());
      }

      if (existingChip?.id_chip) {
        const nextActivo = this.parseActivoExcel(
          item.ACTIVO,
          existingChip.activo ?? true,
        );
        const mustFixOperador =
          chipPayload.operador != null &&
          (existingChip.operador !== chipPayload.operador ||
            (existingChip.observacion &&
              KNOWN_CHIP_OPERADOR_NAMES.has(
                normalizeLookupValue(existingChip.observacion),
              )));
        const mustFixObservacion =
          (existingChip.observacion &&
            KNOWN_CHIP_OPERADOR_NAMES.has(
              normalizeLookupValue(existingChip.observacion),
            ) &&
            chipPayload.observacion == null) ||
          (item.OBSERVACIONES?.trim() &&
            existingChip.observacion !== chipPayload.observacion);
        const mustFixEstado =
          chipPayload.estado_chip != null &&
          existingChip.estado_chip !== chipPayload.estado_chip &&
          ![1, 2].includes(existingChip.estado_chip ?? 0);
        if (
          !this.chipPayloadHasChanges(existingChip, chipPayload) &&
          !mustFixOperador &&
          !mustFixObservacion &&
          !mustFixEstado &&
          Boolean(existingChip.activo ?? true) === nextActivo
        ) {
          unchanged += 1;
          continue;
        }
        toUpdate.push(
          this.moduleChipsRepository.create({
            id_chip: existingChip.id_chip,
            ...chipPayload,
            fecha_registro: existingChip.fecha_registro,
            activo: nextActivo,
          }),
        );
        updated += 1;
        continue;
      }

      toInsert.push(
        this.moduleChipsRepository.create({
          ...chipPayload,
          fecha_registro: new Date(),
          activo: this.parseActivoExcel(item.ACTIVO, true),
        }),
      );
      inserted += 1;
    }

    const BATCH = 80;
    try {
      for (let i = 0; i < toUpdate.length; i += BATCH) {
        await this.moduleChipsRepository.save(toUpdate.slice(i, i + BATCH));
      }
      for (const chip of toInsert) {
        try {
          await this.moduleChipsRepository.save(chip);
        } catch (error) {
          const msg =
            error instanceof Error ? error.message : 'Error al guardar chip';
          warnings.push(
            `Chip ${chip.numero_chip ?? '?'}: ${msg}`,
          );
          inserted -= 1;
        }
      }
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : 'Error al guardar en base de datos';
      throw new BadRequestException(
        `No se pudieron crear/actualizar chips: ${msg}`,
      );
    }

    return {
      inserted,
      updated,
      unchanged,
      duplicateInFile,
      skippedWithoutNumber,
      skippedInvalidRequiredData,
      warnings: warnings.slice(0, 50),
    };
  }

  private normalizeChipNumero(
    value: string | null | undefined,
  ): string | null {
    if (!value) return null;
    const normalized = normalizeLookupValue(value);
    if (
      normalized.includes('SIN INFORM') ||
      normalized === '-' ||
      normalized === 'N/A'
    ) {
      return null;
    }
    const digits = value.replace(/\D/g, '');
    return digits.length === 9 ? digits : null;
  }

  private buildChipPayloadFromExcelRow(
    item: ChipExcelRow,
    numero: string,
    excelRow: number,
    allEstadosChip: MasterDataEstadoChip[],
    allOperadores: MasterDataOperadores[],
    allTiposChip: MasterDataTipoChip[],
    allAreas: MarterDataArea[],
    allColaboradores: MasterDataColaborador[],
    defaultEstadoChipId: number | null,
    defaultOperadorId: number | null,
    warnings: string[],
    existingChip?: EntityMoculesChips,
  ): DeepPartial<EntityMoculesChips> {
    let estadoChipId = this.resolveChipEstadoId(
      item.ESTADO,
      allEstadosChip,
      excelRow,
      warnings,
    );
    let operadorId = this.resolveChipOperadorId(
      item.OPERADOR,
      allOperadores,
      excelRow,
      warnings,
    );
    const tipoChipId = this.resolveChipTipoId(
      item.USO,
      allTiposChip,
      excelRow,
      warnings,
    );
    const areaId = this.resolveChipAreaId(
      item.AREA,
      allAreas,
      excelRow,
      warnings,
    );
    const colaboradorId = this.resolveChipColaboradorId(
      item.USUARIO,
      allColaboradores,
      excelRow,
      warnings,
    );

    if (!estadoChipId && defaultEstadoChipId) estadoChipId = defaultEstadoChipId;
    if (!operadorId && defaultOperadorId) operadorId = defaultOperadorId;

    const observacionText = this.resolveChipObservacionText(
      item.OBSERVACIONES,
      existingChip?.observacion,
    );
    const ticketText = this.resolveChipTicketText(
      item.TICKET,
      existingChip?.ticket,
    );

    const iccidFromExcel = item.ICCID
      ? this.truncateValue(item.ICCID, 25)
      : null;

    const payload: DeepPartial<EntityMoculesChips> = {
      numero_chip: numero,
      iccid:
        this.coalesceTextOnUpdate(iccidFromExcel, existingChip?.iccid) ??
        iccidFromExcel ??
        existingChip?.iccid ??
        numero,
      estado_chip:
        this.coalesceFkOnUpdate(
          item.ESTADO,
          estadoChipId,
          existingChip?.estado_chip,
        ) ?? undefined,
      operador:
        this.coalesceFkOnUpdate(
          item.OPERADOR,
          operadorId,
          existingChip?.operador,
        ) ?? undefined,
      tipo_chip:
        this.coalesceFkOnUpdate(
          item.USO,
          tipoChipId,
          existingChip?.tipo_chip,
        ) ?? undefined,
      area:
        this.coalesceFkOnUpdate(item.AREA, areaId, existingChip?.area) ??
        undefined,
      usuario:
        this.coalesceFkOnUpdate(
          item.USUARIO,
          colaboradorId,
          existingChip?.usuario,
        ) ?? undefined,
      observacion: observacionText ?? undefined,
      ticket: ticketText ?? undefined,
      correo_electronico:
        this.coalesceTextOnUpdate(
          item.CORREO,
          existingChip?.correo_electronico,
        ) ?? undefined,
    };
    return payload;
  }

  /** No conservar en observacion un operador mal grabado (ej. ENTEL por import viejo). */
  private resolveChipObservacionText(
    excelObs: string | null | undefined,
    existingObs?: string | null,
  ): string | null {
    const excelTrim = excelObs?.trim() ?? '';
    if (excelTrim) {
      const norm = normalizeLookupValue(excelTrim);
      if (KNOWN_CHIP_OPERADOR_NAMES.has(norm)) return null;
      return this.truncateValue(excelTrim, 255);
    }
    if (
      existingObs?.trim() &&
      KNOWN_CHIP_OPERADOR_NAMES.has(normalizeLookupValue(existingObs))
    ) {
      return '';
    }
    if (!excelTrim) {
      return '';
    }
    return existingObs?.trim() ? this.truncateValue(existingObs, 255) : null;
  }

  private resolveChipTicketText(
    excelTicket: string | null | undefined,
    existingTicket?: string | null,
  ): string | null {
    const excelTrim = excelTicket?.trim() ?? '';
    if (excelTrim) return this.truncateValue(excelTrim, 255);
    return '';
  }

  private chipPayloadHasChanges(
    existing: EntityMoculesChips,
    next: DeepPartial<EntityMoculesChips>,
  ): boolean {
    const norm = (v: unknown) => (v === undefined || v === '' ? null : v);
    return (
      norm(existing.numero_chip) !== norm(next.numero_chip) ||
      norm(existing.iccid) !== norm(next.iccid) ||
      norm(existing.estado_chip) !== norm(next.estado_chip) ||
      norm(existing.operador) !== norm(next.operador) ||
      norm(existing.tipo_chip) !== norm(next.tipo_chip) ||
      norm(existing.area) !== norm(next.area) ||
      norm(existing.usuario) !== norm(next.usuario) ||
      norm(existing.observacion) !== norm(next.observacion) ||
      norm(existing.ticket) !== norm(next.ticket) ||
      norm(existing.correo_electronico) !== norm(next.correo_electronico)
    );
  }

  private resolveChipEstadoId(
    value: string | null | undefined,
    catalog: MasterDataEstadoChip[],
    excelRow: number,
    warnings: string[],
  ): number | null {
    if (!value) return null;
    const byId = parseNumericId(value);
    if (byId !== null && catalog.some((x) => x.id_estadoChip === byId)) {
      return byId;
    }
    const hit = findMasterCatalogMatch(value, catalog, (x) => x.nombreChips);
    if (!hit) {
      warnings.push(
        `Fila ${excelRow}: ESTADO "${value}" no está en catálogo de estado chip`,
      );
      return null;
    }
    return hit.id_estadoChip;
  }

  private resolveChipOperadorId(
    value: string | null | undefined,
    catalog: MasterDataOperadores[],
    excelRow: number,
    warnings: string[],
  ): number | null {
    if (!value) return null;
    const byId = parseNumericId(value);
    if (byId !== null && catalog.some((x) => x.id_operador === byId)) {
      return byId;
    }
    const hit = findMasterCatalogMatch(
      value,
      catalog,
      (x) => x.nombre_operador,
    );
    if (!hit) {
      warnings.push(
        `Fila ${excelRow}: OPERADOR "${value}" no está en catálogo de operadores`,
      );
      return null;
    }
    return hit.id_operador;
  }

  private resolveChipTipoId(
    value: string | null | undefined,
    catalog: MasterDataTipoChip[],
    excelRow: number,
    warnings: string[],
  ): number | null {
    if (!value) return null;
    const byId = parseNumericId(value);
    if (byId !== null && catalog.some((x) => x.id_tipo_chip === byId)) {
      return byId;
    }
    const hit = findMasterCatalogMatch(
      value,
      catalog,
      (x) => x.descripcion_tipo_chip,
    );
    if (!hit) {
      warnings.push(
        `Fila ${excelRow}: USO "${value}" no está en catálogo tipo chip (VOZ, DATOS)`,
      );
      return null;
    }
    return hit.id_tipo_chip;
  }

  private resolveChipAreaId(
    value: string | null | undefined,
    catalog: MarterDataArea[],
    excelRow: number,
    warnings: string[],
  ): number | null {
    if (!value) return null;
    const byId = parseNumericId(value);
    if (byId !== null && catalog.some((x) => x.id_area === byId)) {
      return byId;
    }
    const hit = findMasterCatalogMatch(value, catalog, (x) => x.nombre_area);
    if (!hit) {
      warnings.push(`Fila ${excelRow}: AREA "${value}" no está en catálogo de áreas`);
      return null;
    }
    return hit.id_area;
  }

  private resolveChipColaboradorId(
    value: string | null | undefined,
    catalog: MasterDataColaborador[],
    excelRow: number,
    warnings: string[],
  ): number | null {
    if (!value) return null;
    const byId = parseNumericId(value);
    if (byId !== null && catalog.some((x) => x.id_colaborador === byId)) {
      return byId;
    }
    const hit = findMasterCatalogMatch(
      value,
      catalog,
      (x) => x.nombre_completo,
    );
    if (!hit) {
      warnings.push(
        `Fila ${excelRow}: USUARIO "${value}" no está en catálogo de colaboradores`,
      );
      return null;
    }
    return hit.id_colaborador;
  }
}
