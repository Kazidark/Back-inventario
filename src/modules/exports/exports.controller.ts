import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ExportsService } from './exports.service';

@Controller('exports')
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get(':module/excel')
  async exportModuleExcel(
    @Param('module') moduleName: string,
    @Res() res: Response,
  ): Promise<void> {
    const { fileName, buffer } =
      await this.exportsService.buildModuleExcel(moduleName);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  }
}
