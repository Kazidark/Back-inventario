import { BadRequestException, Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { EntityMoculesModems } from '../module-modems/entities/module-modem.entity';
import { DeepPartial, Repository } from 'typeorm';
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
  // Columnas esperadas del archivo de entrada.
  // Se respetan nombres históricos para mantener compatibilidad con plantillas antiguas.
  private readonly allowedHeaders = [
    'MARCA',
    'MODELO',
    'IMEI',
    'ESTADO OPERATIVO',
    'ESTASO DE EQUIPO',
    'ESTASDO OPERATIVO2',
    'AREA',
    'USUARIO',
    'CHIP'
  ];

  private readonly allowedHeadersCelulares = [
    'MARCA',
    'MODELO',
    'IMEI',
    'STATUS',
    'ESTADO',
    'AREA',
    'USUARIO',
    'OBSERVACION',
    'OBSERVACIONES',
    'TICKET',
    '#TICKET',
    'TICKER',
    'CORREO',
    'EMAIL',
    'CORREO ELECTRONICO',
  ];

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

  async processExcel(file: Express.Multer.File) {
    // Validación base de entrada.
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo');
    }

    // Se valida por extensión y por mimetype para tolerar diferencias entre clientes.
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
      const data: Record<string, ExcelJS.CellValue>[] = [];

      // La primera hoja se usa como fuente de importación.
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new BadRequestException('El archivo Excel no contiene hojas');
      }

      // Fila 1: encabezados, usados como clave para mapear cada celda.
      const headers: string[] = [];
      worksheet.getRow(1).eachCell((cell, colNumber) => {
        headers[colNumber] = String(cell.value ?? '');
      });

      // Desde fila 2 se construye un arreglo de objetos con el contenido crudo del Excel.
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        const rowData: Record<string, ExcelJS.CellValue> = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber];
          if (!header) return;
          rowData[header] = cell.value;
        });
        data.push(rowData);
      });

      // Se normaliza cada fila para trabajar solo con las columnas permitidas.
      const filteredData = data.map((row) => {
        const filteredRow: Record<string, ExcelJS.CellValue> = {};
        this.allowedHeaders.forEach((header) => {
          filteredRow[header] = row[header] ?? null;
        });
        return filteredRow;
      });

      // Inserta sin romper por duplicados y devuelve resumen de resultados.
      const insertSummary = await this.insertDataDBModem(filteredData);

      const response = {
        success: true,
        message: `Archivo procesado. Nuevos: ${insertSummary.inserted}, existentes: ${insertSummary.existing}, sin IMEI: ${insertSummary.skippedWithoutImei}.`,
        totalRows: filteredData.length,
        summary: insertSummary,
        headers: this.allowedHeaders
      };
      return response;

    } catch (error) {
      // Se envuelve cualquier error en un BadRequest para mantener respuesta consistente del endpoint.
      throw new BadRequestException(
        `Error al procesar el archivo: ${error.message}`,
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

      const headers: string[] = [];
      worksheet.getRow(1).eachCell((cell, colNumber) => {
        headers[colNumber] = String(cell.value ?? '').trim().toUpperCase();
      });

      const data: Record<string, ExcelJS.CellValue>[] = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        const rowData: Record<string, ExcelJS.CellValue> = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber];
          if (!header) return;
          rowData[header] = cell.value;
        });
        data.push(rowData);
      });

      const filteredData = data.map((row) => {
        const filteredRow: Record<string, ExcelJS.CellValue> = {};
        this.allowedHeadersCelulares.forEach((header) => {
          filteredRow[header] = row[header] ?? null;
        });
        return filteredRow;
      });

      const insertSummary = await this.insertDataDBCelulares(filteredData);
      return {
        success: true,
        message: `Archivo de celulares procesado. Nuevos: ${insertSummary.inserted}, actualizados: ${insertSummary.updated}, existentes sin cambios: ${insertSummary.existing}, sin IMEI: ${insertSummary.skippedWithoutImei}.`,
        totalRows: filteredData.length,
        summary: insertSummary,
        headers: this.allowedHeadersCelulares,
      };
    } catch (error) {
      throw new BadRequestException(
        `Error al procesar el archivo de celulares: ${error.message}`,
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

  /** Fila donde aparecen encabezados SERIE + TIPO (plantilla inventario PCs). */
  private findLaptosHeaderRowNumber(
    worksheet: ExcelJS.Worksheet,
  ): number | null {
    let found: number | null = null;
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (found !== null) return;
      let hasSerie = false;
      let hasTipo = false;
      row.eachCell({ includeEmpty: false }, (cell) => {
        const h = this.getCellString(cell.value);
        if (!h) return;
        const n = this.normalizeHeader(h);
        if (n === 'SERIE') hasSerie = true;
        if (n === 'TIPO') hasTipo = true;
      });
      if (hasSerie && hasTipo) {
        found = rowNumber;
      }
    });
    return found;
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
    dataInsert: Record<string, ExcelJS.CellValue>[],
  ): Promise<{ inserted: number; existing: number; skippedWithoutImei: number }> {
    // Extrae IMEIs válidos del archivo para consultar existentes en una sola llamada.
    const imeisFromFile = dataInsert
      .map((item) => this.getExcelField(item, 'IMEI'))
      .filter((imei): imei is string => Boolean(imei));

    const uniqueImeisFromFile = [...new Set(imeisFromFile)];
    const existingModems = uniqueImeisFromFile.length
      ? await this.moduleModemsRepository.find({
          where: uniqueImeisFromFile.map((imei) => ({ imei_modem: imei })),
          select: ['imei_modem'],
        })
      : [];

    const existingImeiSet = new Set(
      existingModems
        .map((modem) => modem.imei_modem)
        .filter((imei): imei is string => Boolean(imei)),
    );

    const seenInCurrentFile = new Set<string>();
    let inserted = 0;
    let existing = 0;
    let skippedWithoutImei = 0;

    // Recorre fila por fila: valida IMEI, evita duplicados y guarda solo nuevos registros.
    for (const item of dataInsert) {
      const imei = this.getExcelField(item, 'IMEI');
      if (!imei) {
        skippedWithoutImei += 1;
        continue;
      }

      if (existingImeiSet.has(imei) || seenInCurrentFile.has(imei)) {
        existing += 1;
        continue;
      }

      const estadoOperativo = this.getExcelField(item, 'ESTADO OPERATIVO');
      const estadoEquipo = this.getExcelField(item, 'ESTADO DE EQUIPO', 'ESTASO DE EQUIPO');
      const area = this.getExcelField(item, 'AREA');
      const usuario = this.getExcelField(item, 'USUARIO');
      const chip = this.getExcelField(item, 'CHIP');

      const [estadoModemId, estadoEquipoId, areaId, colaboradorId, chipId] =
        await Promise.all([
          this.findEstadoModemId(estadoOperativo),
          this.findEstadoEquipoId(estadoEquipo),
          this.findAreaId(area),
          this.findColaboradorId(usuario),
          this.findChipId(chip),
        ]);

      const modemData: DeepPartial<EntityMoculesModems> = {
        marca: this.getExcelField(item, 'MARCA'),
        modelo: this.getExcelField(item, 'MODELO'),
        imei_modem: this.getExcelField(item, 'IMEI'),
        estado_modem: estadoModemId,
        estado_equipo: estadoEquipoId,
        id_area: areaId,
        usuario: colaboradorId,
        num_Chip: chipId,
        fecha_registro: new Date(),
        activo: true,
      };

      const modem = this.moduleModemsRepository.create(modemData);
      await this.moduleModemsRepository.save(modem);
      inserted += 1;
      // Marca IMEI como procesado para detectar duplicados dentro del mismo archivo.
      seenInCurrentFile.add(imei);
    }

    // Resumen usado por el controlador/frontend para mostrar validación al usuario final.
    return {
      inserted,
      existing,
      skippedWithoutImei,
    };
  }

  async insertDataDBCelulares(
    dataInsert: Record<string, ExcelJS.CellValue>[],
  ): Promise<{
    inserted: number;
    updated: number;
    existing: number;
    skippedWithoutImei: number;
  }> {
    const imeisFromFile = dataInsert
      .map((item) => this.getExcelField(item, 'IMEI'))
      .filter((imei): imei is string => Boolean(imei));

    const uniqueImeisFromFile = [...new Set(imeisFromFile)];
    const existingCelulares = uniqueImeisFromFile.length
      ? await this.moduleCelularesRepository.find({
          where: uniqueImeisFromFile.map((imei) => ({ imei_celular: imei })),
          select: ['id_celular', 'imei_celular', 'ticket', 'correo_electronico', 'observacion'],
        })
      : [];

    const existingCelularesByImei = new Map(
      existingCelulares
        .filter((cel) => Boolean(cel.imei_celular))
        .map((cel) => [cel.imei_celular as string, cel]),
    );

    const seenInCurrentFile = new Set<string>();
    let inserted = 0;
    let updated = 0;
    let existing = 0;
    let skippedWithoutImei = 0;

    for (const item of dataInsert) {
      const imei = this.getExcelField(item, 'IMEI');
      if (!imei) {
        skippedWithoutImei += 1;
        continue;
      }

      if (seenInCurrentFile.has(imei)) {
        existing += 1;
        continue;
      }

      const ticketValue = this.truncateValue(
        this.getExcelField(item, '#TICKET', 'TICKET', 'TICKER'),
        255,
      );
      const correoValue = this.truncateValue(
        this.getExcelField(item, 'CORREO', 'EMAIL', 'CORREO ELECTRONICO'),
        255,
      );
      const observacionValue = this.truncateValue(
        this.getExcelField(item, 'OBSERVACION', 'OBSERVACIONES'),
        255,
      );

      const existingCelular = existingCelularesByImei.get(imei);
      if (existingCelular) {
        const hasChanges =
          (existingCelular.ticket ?? null) !== (ticketValue ?? null) ||
          (existingCelular.correo_electronico ?? null) !== (correoValue ?? null) ||
          (existingCelular.observacion ?? null) !== (observacionValue ?? null);

        if (!hasChanges) {
          existing += 1;
          seenInCurrentFile.add(imei);
          continue;
        }

        await this.moduleCelularesRepository.save({
          id_celular: existingCelular.id_celular,
          ticket: ticketValue ?? null,
          correo_electronico: correoValue ?? null,
          observacion: observacionValue ?? null,
        });
        updated += 1;
        seenInCurrentFile.add(imei);
        continue;
      }

      const estadoOperativo = this.getExcelField(item, 'ESTADO');
      const estadoEquipo = this.getExcelField(item, 'STATUS');
      const area = this.getExcelField(item, 'AREA');
      const usuario = this.getExcelField(item, 'USUARIO');

      const [estadoCelularId, estadoEquipoId, areaId, colaboradorId] =
        await Promise.all([
          this.findEstadoModemId(estadoOperativo),
          this.findEstadoEquipoId(estadoEquipo),
          this.findAreaId(area),
          this.findColaboradorId(usuario),
        ]);

      const celularData: DeepPartial<ModuleCelulare> = {
        marca: this.getExcelField(item, 'MARCA') ?? '',
        modelo: this.getExcelField(item, 'MODELO') ?? '',
        imei_celular: imei,
        estado_celular: estadoCelularId,
        estado_equipo: estadoEquipoId,
        id_area: areaId,
        usuario: colaboradorId,
        numero_chip: null,
        ticket: ticketValue ?? null,
        correo_electronico: correoValue ?? null,
        observacion: observacionValue ?? null,
        fecha_registro: new Date(),
        activo: true,
      };

      const celular = this.moduleCelularesRepository.create(celularData);
      await this.moduleCelularesRepository.save(celular);
      inserted += 1;
      seenInCurrentFile.add(imei);
    }

    return {
      inserted,
      updated,
      existing,
      skippedWithoutImei,
    };
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
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new BadRequestException('El archivo Excel no contiene hojas');
      }

      const headerRowNumber = this.findLaptosHeaderRowNumber(worksheet);
      if (headerRowNumber === null) {
        throw new BadRequestException(
          'No se encontró encabezado de PCs/laptops (columnas SERIE y TIPO).',
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

      const insertSummary = await this.insertDataDBLaptos(rows);

      return {
        success: true,
        message: `Archivo de PCs/laptops procesado. Nuevos: ${insertSummary.inserted}, existentes: ${insertSummary.existing}, sin SERIE: ${insertSummary.skippedWithoutSerie}, errores: ${insertSummary.skippedByError}.`,
        totalRows: rows.length,
        summary: insertSummary,
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
        ubicacion:  null,
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

  private findTabletsHeaderRowNumber(
    worksheet: ExcelJS.Worksheet,
  ): number | null {
    let found: number | null = null;
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (found !== null) return;
      let hasMarca = false;
      let hasImei = false;
      row.eachCell({ includeEmpty: false }, (cell) => {
        const h = this.getCellString(cell.value);
        if (!h) return;
        const n = this.normalizeHeader(h);
        if (n === 'MARCA') hasMarca = true;
        if (n === 'IMEI') hasImei = true;
      });
      if (hasMarca && hasImei) {
        found = rowNumber;
      }
    });
    return found;
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
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new BadRequestException('El archivo Excel no contiene hojas');
      }

      const headerRowNumber = this.findTabletsHeaderRowNumber(worksheet);
      if (headerRowNumber === null) {
        throw new BadRequestException(
          'No se encontró encabezado de tablets (columnas MARCA e IMEI).',
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

      const insertSummary = await this.insertDataDBTablets(rows);

      return {
        success: true,
        message: `Archivo de tablets procesado. Nuevos: ${insertSummary.inserted}, existentes: ${insertSummary.existing}, sin IMEI: ${insertSummary.skippedWithoutImei}, errores: ${insertSummary.skippedByError}.`,
        totalRows: rows.length,
        summary: insertSummary,
        headers: this.allowedHeadersTablets,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        `Error al procesar el archivo de tablets: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async insertDataDBTablets(
    rows: Array<{ excelRow: number; item: Record<string, ExcelJS.CellValue> }>,
  ): Promise<{
    inserted: number;
    existing: number;
    skippedWithoutImei: number;
    skippedByError: number;
    errors: string[];
  }> {
    let inserted = 0;
    let existing = 0;
    let skippedWithoutImei = 0;
    let skippedByError = 0;
    const errors: string[] = [];

    const [allAreas, allAsignacion, allEstadoTablet, allColaboradores] =
      await Promise.all([
        this.marterDataAreaRepository.find(),
        this.masterDataAsignacionRepository.find(),
        this.masterDataEstadoEquipoRepository.find(),
        this.masterDataColaboradorRepository.find(),
      ]);

    const seenImeiInFile = new Set<string>();

    for (const { excelRow, item } of rows) {
      const imeiRaw = this.getExcelField(item, 'IMEI');
      const imeiNormalized = this.truncateValue(imeiRaw, 50).trim();
      if (!imeiNormalized) {
        skippedWithoutImei += 1;
        continue;
      }

      if (seenImeiInFile.has(imeiNormalized)) {
        existing += 1;
        errors.push(
          `Fila ${excelRow}: IMEI duplicado en el archivo "${imeiNormalized}"`,
        );
        continue;
      }

      const existe = await this.moduleTabletRepository.findOne({
        where: { imei_tablet: imeiNormalized },
        select: ['id_tablet'],
      });
      if (existe) {
        existing += 1;
        seenImeiInFile.add(imeiNormalized);
        continue;
      }

      const estadoText = this.getExcelField(item, 'ESTADO TABLET');
      const estadoEquipoText = this.getExcelField(item, 'ESTADO EQUI');
      const areaText = this.getExcelField(item, 'AREA');
      const usuarioText = this.getExcelField(item, 'USUARIO');

      let estado_tablet_id =
        estadoText === null ? null : await this.findEstadoModemId(estadoText);
      if (!estado_tablet_id && estadoText) {
        const targetEstado = this.normalizeValue(estadoText);
        const hitEstado = allEstadoTablet.find(
          (x) => targetEstado === this.normalizeValue(x.descripcion),
        );
        estado_tablet_id = hitEstado?.id_estado ?? null;
      }

      let estado_equipo_id =
        estadoEquipoText === null
          ? null
          : await this.findEstadoEquipoId(estadoEquipoText);
      if (!estado_equipo_id && estadoEquipoText) {
        const targetAsignacion = this.normalizeValue(estadoEquipoText);
        const hitAsignacion = allAsignacion.find(
          (x) => targetAsignacion === this.normalizeValue(x.descripcion),
        );
        estado_equipo_id = hitAsignacion?.id_asignado ?? null;
      }

      let id_area = await this.findAreaId(areaText);
      if (!id_area && areaText) {
        const targetArea = this.normalizeValue(areaText);
        const hitArea = allAreas.find(
          (x) => targetArea === this.normalizeValue(x.nombre_area),
        );
        id_area = hitArea?.id_area ?? null;
      }

      let usuario = await this.findColaboradorId(usuarioText);
      if (!usuario && usuarioText) {
        const targetUser = this.normalizeValue(usuarioText);
        const hitUsuario = allColaboradores.find(
          (x) => targetUser === this.normalizeValue(x.nombre_completo),
        );
        usuario = hitUsuario?.id_colaborador ?? null;
      }

      const tabletData: DeepPartial<ModuleTablet> = {
        marca: this.truncateValue(this.getExcelField(item, 'MARCA'), 50) || 'S/D',
        modelo:
          this.truncateValue(this.getExcelField(item, 'MODELO'), 80) || 'S/D',
        imei_tablet: imeiNormalized,
        estado_tablet: estado_tablet_id,
        estado_equipo: estado_equipo_id,
        id_area,
        usuario,
        ubicacion:null,
        observaciones:
          this.truncateValue(
            this.getExcelField(item, 'OBS1', 'OBSERVACION', 'OBSERVACIONES'),
            255,
          ) || null,
        num_chips: null,
        fecha_registro: new Date(),
        activo: true,
      };

      try {
        const tablet = this.moduleTabletRepository.create(tabletData);
        await this.moduleTabletRepository.save(tablet);
        inserted += 1;
        seenImeiInFile.add(imeiNormalized);
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
      skippedWithoutImei,
      skippedByError,
      errors: errors.slice(0, 50),
    };
  }

  async insertDataDBLaptos(
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

    const [allAreas, allAsignacion, allEstadoPc, allColaboradores, allUbicaciones] =
      await Promise.all([
        this.marterDataAreaRepository.find(),
        this.masterDataAsignacionRepository.find(),
        this.masterDataEstadoEquipoRepository.find(),
        this.masterDataColaboradorRepository.find(),
        this.masterDataUbicacionRepository.find(),
      ]);

    const seenSerieInFile = new Set<string>();

    for (const { excelRow, item } of rows) {
      const serieRaw = this.getExcelField(item, 'SERIE');
      const serieTrimmed =
        serieRaw?.trim().replace(/\s+/g, ' ') ?? '';
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

      const existe = await this.laptoRepository.findOne({
        where: { serie: serieNormalized },
        select: ['id_pc'],
      });
      if (existe) {
        existing += 1;
        seenSerieInFile.add(serieNormalized);
        continue;
      }

      const tipo_equipo =
        this.truncateValue(this.getExcelField(item, 'TIPO'), 50) || 'S/D';

      let marca =
        this.truncateValue(this.getExcelField(item, 'MARCA'), 50) || 'S/D';
      if (marca === 'S/D' || marca.includes('[object')) {
        marca = 'S/D';
      }

      const modelo =
        this.truncateValue(this.getExcelField(item, 'MODELO'), 50) || 'S/D';

      const estadoEquipoText = this.getExcelField(item, 'ESTADO_EQUIPO');
      const estadoPcText = this.getExcelField(item, 'ESTADO_PC');
      const areaText = this.getExcelField(item, 'AREA');
      const usuarioText = this.getExcelField(item, 'USUARIO');

      let estado_equipo_id =
        estadoEquipoText === null ? null :
        await this.findEstadoEquipoId(estadoEquipoText);

      if (!estado_equipo_id && estadoEquipoText) {
        const target = this.normalizeValue(estadoEquipoText);
        const hitAsig = allAsignacion.find(
          (x) =>
            target === this.normalizeValue(x.descripcion),
        );
        estado_equipo_id = hitAsig?.id_asignado ?? null;
      }

      let estado_pc_id =
        estadoPcText === null ?
          null :
        await this.findEstadoModemId(estadoPcText);

      if (!estado_pc_id && estadoPcText) {
        const targetPc = this.normalizeValue(estadoPcText);
        const hitPc = allEstadoPc.find(
          (x) =>
            targetPc === this.normalizeValue(x.descripcion),
        );
        estado_pc_id = hitPc?.id_estado ?? null;
      }

      let id_area = await this.findAreaId(areaText);
      if (!id_area && areaText) {
        const ta = this.normalizeValue(areaText);
        const hitArea = allAreas.find(
          (a) =>
            ta === this.normalizeValue(a.nombre_area),
        );
        id_area = hitArea?.id_area ?? null;
      }

      let usuario: number | null = await this.findColaboradorId(usuarioText);

      if (!usuario && usuarioText) {
        const tu = this.normalizeValue(usuarioText);
        const hitCol = allColaboradores.find(
          (c) =>
            tu === this.normalizeValue(c.nombre_completo),
        );
        usuario = hitCol?.id_colaborador ?? null;
      }

      const ubicacionRaw = this.getExcelField(item, 'UBICACION');
      let ubicacion_id: number | null = null;
      if (ubicacionRaw) {
        const normalizedUb = this.normalizeValue(ubicacionRaw);
        const hitUb = allUbicaciones.find(
          (u) => normalizedUb === this.normalizeValue(u.descripcion),
        );
        ubicacion_id = hitUb?.id ?? null;
      }

      const observacionesRaw = this.getExcelField(
        item,
        'OBSERVACION',
        'OBSERVACIONES',
      );

      const laptoData: DeepPartial<Lapto> = {
        tipo_equipo,
        marca,
        modelo,
        serie: serieNormalized,
        estado_equipo: estado_equipo_id,
        estado_pc: estado_pc_id,
        id_area,
        usuario,
        ubicacion: ubicacion_id,
        observaciones: this.truncateValue(observacionesRaw, 255) || null,
        anexo: this.parseAnexoInt(this.getExcelField(item, 'ANEXO')),
        fecha_registro: new Date(),
        activo: true,
      };

      try {
        const lapto = this.laptoRepository.create(laptoData);
        await this.laptoRepository.save(lapto);
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

      let headerRowNumber: number | null = null;
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (headerRowNumber) return;
        const firstCell = this.getCellString(row.getCell(1).value);
        const normalizedFirstCell = firstCell
          ? this.normalizeHeader(firstCell)
          : null;
        if (normalizedFirstCell === 'NUMERO') {
          headerRowNumber = rowNumber;
        }
      });

      if (!headerRowNumber) {
        throw new BadRequestException(
          'No se encontró la fila de encabezados de chips (columna NÚMERO).',
        );
      }
      const resolvedHeaderRow = headerRowNumber;

      const data: Record<string, ExcelJS.CellValue>[] = [];
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber <= resolvedHeaderRow) return;
        const rowData: Record<string, ExcelJS.CellValue> = {
          NUMERO: row.getCell(1).value,
          ICCID: row.getCell(2).value,
          ESTADO: row.getCell(3).value,
          OPERADOR: row.getCell(4).value,
          AREA: row.getCell(5).value,
          USUARIO: row.getCell(6).value,
          TIPO: row.getCell(7).value,
          OBSERVACIONES: row.getCell(8).value,
          '#TICKET': row.getCell(9).value,
          CORREO: row.getCell(10).value,
        };
        data.push(rowData);
      });

      const filteredData = data;

      const insertSummary = await this.insertDataDBChips(filteredData);

      return {
        success: true,
        message: `Archivo de chips procesado. Nuevos: ${insertSummary.inserted}, existentes: ${insertSummary.existing}, sin número: ${insertSummary.skippedWithoutNumber}, inválidos: ${insertSummary.skippedInvalidRequiredData}, errores: ${insertSummary.skippedByError}.`,
        totalRows: filteredData.length,
        summary: insertSummary,
        headers: this.allowedHeadersChips,
      };
    }
    catch (error) {
      throw new BadRequestException(
        `Error al procesar el archivo de chips: ${error.message}`,
      );
    }
  }

  async insertDataDBChips(
    dataInsert: Record<string, ExcelJS.CellValue>[],
  ): Promise<{
    inserted: number;
    existing: number;
    skippedWithoutNumber: number;
    skippedInvalidRequiredData: number;
    skippedByError: number;
    errors: string[];
  }> {
    const seenInCurrentFile = new Set<string>();
    let inserted = 0;
    let existing = 0;
    let skippedWithoutNumber = 0;
    let skippedInvalidRequiredData = 0;
    let skippedByError = 0;
    const errors: string[] = [];

    const [allEstadosChip, allOperadores, allTiposChip] = await Promise.all([
      this.masterDataEstadoChipRepository.find(),
      this.masterDataOperadoresRepository.find(),
      this.masterDataTipoChipRepository.find(),
    ]);
    const defaultEstadoChipId = allEstadosChip[0]?.id_estadoChip ?? null;
    const defaultOperadorId = allOperadores[0]?.id_operador ?? null;

    for (let index = 0; index < dataInsert.length; index += 1) {
      const item = dataInsert[index];
      const excelRow = index + 2;
      const numeroChipRaw = this.getExcelField(item, 'NUMERO');
      const numeroChip = (numeroChipRaw ?? '').replace(/\D/g, '');
      if (!numeroChip || numeroChip.length !== 9) {
        skippedWithoutNumber += 1;
        errors.push(
          `Fila ${excelRow}: NUMERO inválido "${numeroChipRaw ?? ''}" (debe tener 9 dígitos)`,
        );
        continue;
      }

      if (seenInCurrentFile.has(numeroChip)) {
        existing += 1;
        continue;
      }

      const chipExistente = await this.moduleChipsRepository.findOne({
        where: { numero_chip: numeroChip },
        select: ['id_chip'],
      });
      if (chipExistente) {
        existing += 1;
        continue;
      }

      const estadoRaw = this.getExcelField(item, 'ESTADO');
      const operadorRaw = this.getExcelField(item, 'OPERADOR');
      const tipoRaw = this.getExcelField(item, 'TIPO');

      let estadoChipId = await this.findEstadoChipId(estadoRaw);
      let operadorId = await this.findOperadorId(operadorRaw);
      let tipoChipId = await this.findTipoChipId(tipoRaw);

      if (!estadoChipId && estadoRaw) {
        const normalizedEstado = this.normalizeValue(estadoRaw);
        const estado = allEstadosChip.find(
          (value) => this.normalizeValue(value.nombreChips) === normalizedEstado,
        );
        estadoChipId = estado?.id_estadoChip ?? null;
      }

      if (!operadorId && operadorRaw) {
        const normalizedOperador = this.normalizeValue(operadorRaw);
        const operador = allOperadores.find(
          (value) =>
            this.normalizeValue(value.nombre_operador) === normalizedOperador,
        );
        operadorId = operador?.id_operador ?? null;
      }

      if (!tipoChipId && tipoRaw) {
        const normalizedTipo = this.normalizeValue(tipoRaw);
        const tipo = allTiposChip.find(
          (value) =>
            this.normalizeValue(value.descripcion_tipo_chip) === normalizedTipo,
        );
        tipoChipId = tipo?.id_tipo_chip ?? null;
      }

      const [areaId, colaboradorId] = await Promise.all([
        this.findAreaId(this.getExcelField(item, 'AREA')),
        this.findColaboradorId(this.getExcelField(item, 'USUARIO')),
      ]);

      if (!estadoChipId && defaultEstadoChipId) {
        estadoChipId = defaultEstadoChipId;
      }
      if (!operadorId && defaultOperadorId) {
        operadorId = defaultOperadorId;
      }

      if (!estadoChipId || !operadorId) {
        skippedInvalidRequiredData += 1;
        errors.push(
          `Fila ${excelRow}: estado u operador inválido (ESTADO="${estadoRaw ?? ''}", OPERADOR="${operadorRaw ?? ''}")`,
        );
        continue;
      }

      const chipData: DeepPartial<EntityMoculesChips> = {
        numero_chip: numeroChip,
        iccid: this.truncateValue(this.getExcelField(item, 'ICCID'), 25),
        estado_chip: estadoChipId,
        operador: operadorId,
        area: areaId,
        usuario: colaboradorId,
        tipo_chip: tipoChipId,
        observacion: this.truncateValue(this.getExcelField(item, 'OBSERVACIONES'), 255),
        ticket: this.truncateValue(
          this.getExcelField(item, '#TICKET', 'TICKET'),
          255,
        ),
        correo_electronico: this.truncateValue(this.getExcelField(item, 'CORREO'), 255),
        fecha_registro: new Date(),
        activo: true,
      };

      try {
        const chip = this.moduleChipsRepository.create(chipData);
        await this.moduleChipsRepository.save(chip);
        inserted += 1;
        seenInCurrentFile.add(numeroChip);
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
      skippedWithoutNumber,
      skippedInvalidRequiredData,
      skippedByError,
      errors: errors.slice(0, 50),
    };
  }
}
