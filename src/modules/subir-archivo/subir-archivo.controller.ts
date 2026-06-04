import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { SubirArchivoService } from './subir-archivo.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('excel')
export class SubirArchivoController {
  constructor(private readonly subirArchivoService: SubirArchivoService) { }

  /** Plantilla vacía con columnas para importar módems (mismos nombres que exportación). */
  @Get('modems/plantilla')
  async downloadModemPlantilla(@Res() res: Response): Promise<void> {
    const { fileName, buffer } =
      await this.subirArchivoService.buildModemTemplateExcel();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  }

  @Get('celulares/plantilla')
  async downloadCelularPlantilla(@Res() res: Response): Promise<void> {
    const { fileName, buffer } =
      await this.subirArchivoService.buildCelularTemplateExcel();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  }

  @Get('chips/plantilla')
  async downloadChipPlantilla(@Res() res: Response): Promise<void> {
    const { fileName, buffer } =
      await this.subirArchivoService.buildChipTemplateExcel();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  }

  @Get('laptos/plantilla')
  async downloadLaptopPlantilla(@Res() res: Response): Promise<void> {
    const { fileName, buffer } =
      await this.subirArchivoService.buildLaptopTemplateExcel();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  }

  /** Compruebe en el navegador: http://localhost:3000/api/excel/tablets/import-version */
  @Get('tablets/import-version')
  getTabletImportVersion() {
    return {
      importVersion: 'tablets-catalog-fk-v3',
      descripcion:
        'Importa ESTADO OPERATIVO → estado_tablet, ESTADO DEL EQUIPO → estado_equipo, UBICACIÓN → ubicacion (IDs de tablas maestras).',
    };
  }

  @Get('tablets/plantilla')
  async downloadTabletPlantilla(@Res() res: Response): Promise<void> {
    const { fileName, buffer } =
      await this.subirArchivoService.buildTabletTemplateExcel();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  }

   /**
    *NOTE API PARA SUBIR  EXEL DE  MODEL
   */
  @Post('upload-model')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 1024 * 1024 * 20, // 5MB
      },
      fileFilter: (_req, file, cb) => {
        console.log('[UPLOAD][fileFilter] file recibido:', {
          fieldname: file?.fieldname,
          originalname: file?.originalname,
          mimetype: file?.mimetype,
          size: file?.size,
        });

        const extension = file.originalname.split('.').pop()?.toLowerCase();
        const validExtension = extension === 'xlsx';
        const validMimeType =
          file.mimetype ===
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        if (!validExtension && !validMimeType) {
          return cb(
            new BadRequestException(
              'El archivo debe ser un Excel válido (.xlsx)',
            ) as Error,
            false,
          );
        }

        cb(null, true);
      },
    }),
  )
  async uploadExcel(@UploadedFile() file: Express.Multer.File) {
    console.log('[UPLOAD][uploadExcel] archivo subido:', {
      fieldname: file?.fieldname,
      originalname: file?.originalname,
      mimetype: file?.mimetype,
      size: file?.size,
    });
    return this.subirArchivoService.processExcel(file);
  }
  /**
    *NOTE API PARA SUBIR  EXEL DE  CELULARESS
   */
  @Post('upload-celulares')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 1024 * 1024 * 20,
      },
      fileFilter: (_req, file, cb) => {
        const extension = file.originalname.split('.').pop()?.toLowerCase();
        const validExtension = extension === 'xlsx';
        const validMimeType =
          file.mimetype ===
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        if (!validExtension && !validMimeType) {
          return cb(
            new BadRequestException(
              'El archivo debe ser un Excel válido (.xlsx)',
            ) as Error,
            false,
          );
        }

        cb(null, true);
      },
    }),
  )
  async uploadCelulares(@UploadedFile() file: Express.Multer.File) {
    return this.subirArchivoService.processExcelCelulares(file);
  }

  /**
    *NOTE API PARA SUBIR  EXEL DE  CHIPS
   */
  @Post('upload-chips')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 1024 * 1024 * 20,
      },
      fileFilter: (_req, file, cb) => {
        const extension = file.originalname.split('.').pop()?.toLowerCase();
        const validExtension = extension === 'xlsx';
        const validMimeType =
          file.mimetype ===
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        if (!validExtension && !validMimeType) {
          return cb(
            new BadRequestException(
              'El archivo debe ser un Excel válido (.xlsx)',
            ) as Error,
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadChips(@UploadedFile() file: Express.Multer.File) {
    return this.subirArchivoService.processExcelChips(file);
  }
  /**
    *NOTE API PARA SUBIR  EXEL DE  LAPTOS/PC
   */
  @Post('upload-pcs-laptops')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 1024 * 1024 * 20,
      },
      fileFilter: (_req, file, cb) => {
        const extension = file.originalname.split('.').pop()?.toLowerCase();
        const validExtension = extension === 'xlsx';
        const validMimeType =
          file.mimetype ===
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        if (!validExtension && !validMimeType) {
          return cb(
            new BadRequestException(
              'El archivo debe ser un Excel válido (.xlsx)',
            ) as Error,
            false,
          );
        }

        cb(null, true);
      },
    }),
  )
  async uploadPcsLaptops(@UploadedFile() file: Express.Multer.File) {
    return this.subirArchivoService.processExcelLaptos(file);
  }
  /**
    *NOTE API PARA SUBIR  EXEL DE  MONITORES
   */
  @Post('upload-monitores')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 1024 * 1024 * 20,
      },
      fileFilter: (_req, file, cb) => {
        const extension = file.originalname.split('.').pop()?.toLowerCase();
        const validExtension = extension === 'xlsx';
        const validMimeType =
          file.mimetype ===
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        if (!validExtension && !validMimeType) {
          return cb(
            new BadRequestException(
              'El archivo debe ser un Excel válido (.xlsx)',
            ) as Error,
            false,
          );
        }

        cb(null, true);
      },
    }),
  )
  async uploadMonitores(@UploadedFile() file: Express.Multer.File) {
    return this.subirArchivoService.processExcelMonitores(file);
  }
  /**
    *NOTE API PARA SUBIR  EXEL DE  TABLET
   */
  @Post('upload-tablets')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 1024 * 1024 * 20,
      },
      fileFilter: (_req, file, cb) => {
        const extension = file.originalname.split('.').pop()?.toLowerCase();
        const validExtension = extension === 'xlsx';
        const validMimeType =
          file.mimetype ===
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        if (!validExtension && !validMimeType) {
          return cb(
            new BadRequestException(
              'El archivo debe ser un Excel válido (.xlsx)',
            ) as Error,
            false,
          );
        }

        cb(null, true);
      },
    }),
  )
  async uploadTablets(@UploadedFile() file: Express.Multer.File) {
    return this.subirArchivoService.processExcelTablets(file);
  }
}
