import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { MetricsCalculationService } from './metrics-calculation.service';
import { Builder } from 'xml2js';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ReportService {
  private consolidatedDir: string;

  constructor(
    private prisma: PrismaService,
    private metricsService: MetricsCalculationService,
  ) {
    this.consolidatedDir = path.join(process.cwd(), 'uploads', 'consolidated');
    if (!fs.existsSync(this.consolidatedDir)) {
      fs.mkdirSync(this.consolidatedDir, { recursive: true });
    }
  }

  async getDashboard() {
    const overallMetrics = await this.metricsService.calculateOverallMetrics();
    const totalCourses = await this.prisma.course.count();
    const totalClasses = await this.prisma.class.count();
    const totalImports = await this.prisma.importLog.count({
      where: { status: 'success' },
    });

    return {
      ...overallMetrics,
      totalCourses,
      totalClasses,
      totalImports,
    };
  }

  async getStudentsReport(courseCode?: string) {
    const where = courseCode
      ? {
          enrollments: {
            some: {
              class: {
                course: {
                  code: courseCode,
                },
              },
            },
          },
        }
      : {};

    const students = await this.prisma.student.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    const studentsWithMetrics = await Promise.all(
      students.map(async (student) => {
        const metrics = await this.metricsService.calculateStudentMetrics(student.id);
        return {
          ...student,
          ...metrics,
        };
      }),
    );

    return studentsWithMetrics;
  }

  async getClassesReport(courseCode?: string, semester?: string) {
    const where: any = {};
    if (courseCode) {
      where.course = { code: courseCode };
    }
    if (semester) {
      where.semester = semester;
    }

    const classes = await this.prisma.class.findMany({
      where,
      include: {
        course: true,
      },
      orderBy: [{ course: { code: 'asc' } }, { semester: 'desc' }],
    });

    const classesWithMetrics = await Promise.all(
      classes.map(async (classItem) => {
        const metrics = await this.metricsService.calculateClassMetrics(classItem.id);
        return {
          id: classItem.id,
          classId: classItem.classId,
          courseCode: classItem.course.code,
          courseName: classItem.course.name,
          semester: classItem.semester,
          ...metrics,
        };
      }),
    );

    return classesWithMetrics;
  }

  async getCoursesReport() {
    const courses = await this.prisma.course.findMany({
      orderBy: { code: 'asc' },
    });

    const coursesWithMetrics = await Promise.all(
      courses.map(async (course) => {
        const metrics = await this.metricsService.calculateCourseMetrics(course.code);
        return {
          ...course,
          ...metrics,
        };
      }),
    );

    return coursesWithMetrics;
  }

  async exportXml(): Promise<string> {
    const students = await this.prisma.student.findMany({
      include: {
        enrollments: {
          include: {
            class: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    });

    const alunos = await Promise.all(
      students.map(async (student) => {
        const metrics = await this.metricsService.calculateStudentMetrics(student.id);
        const disciplinas = metrics.disciplines.map((disc) => ({
          Disciplina: {
            $: {
              Codigo: disc.courseCode,
              Nome: disc.courseName,
              CargaHoraria: disc.workload.toString(),
              Semestre: disc.semester,
            },
            Nota: [disc.grade.toString()],
            Status: [disc.status],
          },
        }));

        return {
          Aluno: {
            $: {
              RA: student.ra,
              Nome: student.name,
            },
            Disciplinas: disciplinas,
            MediaGeral: [metrics.gpa.toString()],
            SituacaoGeral: [metrics.overallStatus],
          },
        };
      }),
    );

    const builder = new Builder({
      xmldec: { version: '1.0', encoding: 'UTF-8' },
      rootName: 'Resultados',
    });

    return builder.buildObject({ Alunos: alunos });
  }

  async exportCsv(): Promise<string> {
    const students = await this.prisma.student.findMany({
      include: {
        enrollments: {
          include: {
            class: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    });

    const rows: string[] = [];
    rows.push(
      'RA,Nome,Código Disciplina,Nome Disciplina,Nota,Status Disciplina,Média Geral,Situação Geral',
    );

    for (const student of students) {
      const metrics = await this.metricsService.calculateStudentMetrics(student.id);
      
      if (metrics.disciplines.length === 0) {
        rows.push(
          `${student.ra},"${student.name}",,,,,"${metrics.gpa}","${metrics.overallStatus}"`,
        );
      } else {
        for (const disc of metrics.disciplines) {
          rows.push(
            `${student.ra},"${student.name}","${disc.courseCode}","${disc.courseName}",${disc.grade},"${disc.status}","${metrics.gpa}","${metrics.overallStatus}"`,
          );
        }
      }
    }

    return rows.join('\n');
  }

  async exportJson(): Promise<any> {
    const students = await this.prisma.student.findMany({
      include: {
        enrollments: {
          include: {
            class: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    });

    const alunos = await Promise.all(
      students.map(async (student) => {
        const metrics = await this.metricsService.calculateStudentMetrics(student.id);
        return {
          RA: student.ra,
          Nome: student.name,
          Disciplinas: metrics.disciplines.map((disc) => ({
            Codigo: disc.courseCode,
            Nome: disc.courseName,
            CargaHoraria: disc.workload,
            Semestre: disc.semester,
            Nota: disc.grade,
            Status: disc.status,
          })),
          MediaGeral: metrics.gpa,
          SituacaoGeral: metrics.overallStatus,
        };
      }),
    );

    return {
      geradoEm: new Date().toISOString(),
      alunos,
    };
  }

  async exportPdf(): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {});

    // Capa
    doc.fontSize(24).text('Relatório de Notas Acadêmicas', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, {
      align: 'center',
    });
    doc.addPage();

    // Métricas gerais
    const dashboard = await this.getDashboard();
    doc.fontSize(18).text('Visão Geral', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12);
    doc.text(`Total de Alunos: ${dashboard.totalStudents}`);
    doc.text(`Média Geral (GPA): ${dashboard.overallGPA}`);
    doc.text(`Taxa de Aprovação: ${dashboard.overallApprovalRate}%`);
    doc.text(`Total de Disciplinas: ${dashboard.totalCourses}`);
    doc.text(`Total de Turmas: ${dashboard.totalClasses}`);
    doc.addPage();

    // Relatório por aluno
    doc.fontSize(18).text('Resultados por Aluno', { underline: true });
    doc.moveDown();

    const students = await this.getStudentsReport();
    for (const student of students.slice(0, 50)) { // Limitar a 50 alunos para não sobrecarregar
      doc.fontSize(14).text(`${student.name} (RA: ${student.ra})`, {
        underline: true,
      });
      doc.moveDown(0.3);
      doc.fontSize(10);
      doc.text(`Média Geral: ${student.gpa}`);
      doc.text(`Situação: ${student.overallStatus}`);
      doc.moveDown(0.3);

      if (student.disciplines && student.disciplines.length > 0) {
        doc.text('Disciplinas:');
        student.disciplines.forEach((disc: any) => {
          doc.text(
            `  - ${disc.courseName} (${disc.courseCode}): ${disc.grade} - ${disc.status}`,
            { indent: 20 },
          );
        });
      }

      doc.moveDown();
      if (doc.y > 700) {
        doc.addPage();
      }
    }

    // Relatório por disciplina
    doc.addPage();
    doc.fontSize(18).text('Estatísticas por Disciplina', { underline: true });
    doc.moveDown();

    const courses = await this.getCoursesReport();
    for (const course of courses) {
      doc.fontSize(12).text(`${course.name} (${course.code})`, {
        underline: true,
      });
      doc.moveDown(0.3);
      doc.fontSize(10);
      doc.text(`Média: ${course.average}`);
      doc.text(`Desvio Padrão: ${course.standardDeviation}`);
      doc.text(`Taxa de Aprovação: ${course.approvalRate}%`);
      doc.text(`Total de Alunos: ${course.totalStudents}`);
      doc.moveDown();

      if (doc.y > 700) {
        doc.addPage();
      }
    }

    doc.end();

    return new Promise((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });
  }

  async getConsolidatedFile(
    importId: number,
    format: string,
    res: Response,
  ): Promise<void> {
    const importLog = await this.prisma.importLog.findUnique({
      where: { id: importId },
    });

    if (!importLog) {
      throw new Error('Importação não encontrada');
    }

    const filePath = path.join(
      this.consolidatedDir,
      `${importLog.fileHash}.${format}`,
    );

    if (fs.existsSync(filePath)) {
      // Arquivo já existe, retornar
      const content = fs.readFileSync(filePath);
      res.setHeader('Content-Type', this.getContentType(format));
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="consolidado.${format}"`,
      );
      res.send(content);
      return;
    }

    // Gerar arquivo consolidado
    let content: string | Buffer;
    let contentType: string;

    switch (format) {
      case 'xml':
        content = await this.exportXml();
        contentType = 'application/xml';
        break;
      case 'csv':
        content = await this.exportCsv();
        contentType = 'text/csv';
        break;
      case 'json':
        content = JSON.stringify(await this.exportJson(), null, 2);
        contentType = 'application/json';
        break;
      case 'pdf':
        content = await this.exportPdf();
        contentType = 'application/pdf';
        break;
      default:
        throw new Error('Formato não suportado');
    }

    // Salvar arquivo
    fs.writeFileSync(filePath, content);

    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="consolidado.${format}"`,
    );
    res.send(content);
  }

  private getContentType(format: string): string {
    const types: Record<string, string> = {
      xml: 'application/xml',
      csv: 'text/csv',
      json: 'application/json',
      pdf: 'application/pdf',
    };
    return types[format] || 'application/octet-stream';
  }
}


