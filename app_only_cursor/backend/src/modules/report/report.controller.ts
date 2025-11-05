import {
  Controller,
  Get,
  Query,
  UseGuards,
  Res,
  Param,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportService } from './report.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportController {
  constructor(private reportService: ReportService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Obter métricas do dashboard' })
  async getDashboard() {
    return this.reportService.getDashboard();
  }

  @Get('students')
  @ApiOperation({ summary: 'Relatório de alunos' })
  async getStudentsReport(@Query('courseCode') courseCode?: string) {
    return this.reportService.getStudentsReport(courseCode);
  }

  @Get('classes')
  @ApiOperation({ summary: 'Relatório por turma' })
  async getClassesReport(
    @Query('courseCode') courseCode?: string,
    @Query('semester') semester?: string,
  ) {
    return this.reportService.getClassesReport(courseCode, semester);
  }

  @Get('courses')
  @ApiOperation({ summary: 'Relatório por disciplina' })
  async getCoursesReport() {
    return this.reportService.getCoursesReport();
  }

  @Get('export/xml')
  @ApiOperation({ summary: 'Exportar dados em XML' })
  async exportXml(@Res() res: Response) {
    const xml = await this.reportService.exportXml();
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', 'attachment; filename="dados_consolidados.xml"');
    res.send(xml);
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Exportar dados em CSV' })
  async exportCsv(@Res() res: Response) {
    const csv = await this.reportService.exportCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="dados_consolidados.csv"');
    res.send(csv);
  }

  @Get('export/json')
  @ApiOperation({ summary: 'Exportar dados em JSON' })
  async exportJson(@Res() res: Response) {
    const json = await this.reportService.exportJson();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="dados_consolidados.json"');
    res.json(json);
  }

  @Get('export/pdf')
  @ApiOperation({ summary: 'Exportar relatório em PDF' })
  async exportPdf(@Res() res: Response) {
    const pdf = await this.reportService.exportPdf();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="relatorio_completo.pdf"');
    res.send(pdf);
  }

  @Get('imports/:id/consolidated/:format')
  @ApiOperation({ summary: 'Download de arquivo consolidado de uma importação' })
  async getConsolidatedFile(
    @Param('id') id: string,
    @Param('format') format: string,
    @Res() res: Response,
  ) {
    return this.reportService.getConsolidatedFile(parseInt(id), format, res);
  }
}


