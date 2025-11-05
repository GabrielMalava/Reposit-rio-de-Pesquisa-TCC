import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { XmlValidationService } from './xml-validation.service';
import { MetricsCalculationService } from '../report/metrics-calculation.service';
import { parseString } from 'xml2js';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ImportService {
  private uploadsDir: string;

  constructor(
    private prisma: PrismaService,
    private xmlValidation: XmlValidationService,
    private metricsService: MetricsCalculationService,
  ) {
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async importXml(
    xmlBuffer: Buffer,
    fileName: string,
    userId?: number,
  ): Promise<any> {
    const startTime = Date.now();
    const fileHash = crypto.createHash('md5').update(xmlBuffer).digest('hex');

    try {
      // Validação XSD
      const validation = await this.xmlValidation.validateXml(xmlBuffer);
      if (!validation.valid) {
        throw new BadRequestException(
          `Validação XML falhou: ${validation.errors.join(', ')}`,
        );
      }

      // Parse XML
      const xmlString = xmlBuffer.toString('utf-8');
      const parsedXml = await this.parseXml(xmlString);

      // Validar dados de negócio
      this.validateBusinessRules(parsedXml);

      // Salvar arquivo original
      const filePath = path.join(this.uploadsDir, `${fileHash}.xml`);
      fs.writeFileSync(filePath, xmlBuffer);

      // Persistir dados em transação
      const result = await this.prisma.$transaction(async (tx) => {
        // Importar Cursos
        const courses = await this.importCourses(parsedXml.Cursos.Curso || [], tx);

        // Importar Turmas
        const classes = await this.importClasses(
          parsedXml.Turmas.Turma || [],
          courses,
          tx,
        );

        // Importar Alunos
        const students = await this.importStudents(parsedXml.Alunos.Aluno || [], tx);

        // Importar Notas
        const enrollments = await this.importEnrollments(
          parsedXml.Notas.Nota || [],
          students,
          classes,
          tx,
        );

        // Criar log de importação
        const importLog = await tx.importLog.create({
          data: {
            userId: userId || null,
            fileName,
            fileHash,
            recordsImported: students.length,
            status: 'success',
            processingTime: Date.now() - startTime,
          },
        });

        return {
          importLog,
          students: students.length,
          courses: courses.length,
          classes: classes.length,
          enrollments: enrollments.length,
        };
      });

      // Calcular métricas após importação
      await this.metricsService.calculateAndStoreMetrics();

      return result;
    } catch (error: any) {
      // Criar log de erro
      await this.prisma.importLog.create({
        data: {
          userId: userId || null,
          fileName,
          fileHash,
          recordsImported: 0,
          status: 'failure',
          errorMessage: error.message,
          processingTime: Date.now() - startTime,
        },
      });

      throw error;
    }
  }

  private async parseXml(xmlString: string): Promise<any> {
    return new Promise((resolve, reject) => {
      parseString(xmlString, (err, result) => {
        if (err) {
          reject(new BadRequestException(`Erro ao parsear XML: ${err.message}`));
        } else {
          resolve(result.Importacao);
        }
      });
    });
  }

  private validateBusinessRules(parsedXml: any): void {
    const errors: string[] = [];

    // Validar notas entre 0 e 10
    const notas = parsedXml.Notas?.Nota || [];
    for (const nota of notas) {
      const valor = parseFloat(nota.Valor[0]);
      if (isNaN(valor) || valor < 0 || valor > 10) {
        errors.push(`Nota inválida: ${nota.Valor[0]} (deve estar entre 0 e 10)`);
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException(errors.join('; '));
    }
  }

  private async importCourses(cursos: any[], tx: any): Promise<any[]> {
    const imported = [];
    for (const curso of cursos) {
      const cursoData = {
        code: curso.Codigo[0],
        name: curso.Nome[0],
        workload: parseInt(curso.CargaHoraria[0]),
      };

      const course = await tx.course.upsert({
        where: { code: cursoData.code },
        update: { name: cursoData.name, workload: cursoData.workload },
        create: cursoData,
      });

      imported.push(course);
    }
    return imported;
  }

  private async importClasses(turmas: any[], courses: any[], tx: any): Promise<any[]> {
    const courseMap = new Map(courses.map((c) => [c.code, c.id]));
    const imported = [];

    for (const turma of turmas) {
      const cursoCodigo = turma.CursoCodigo[0];
      const courseId = courseMap.get(cursoCodigo);

      if (!courseId) {
        throw new BadRequestException(
          `Curso não encontrado: ${cursoCodigo} para turma ${turma.Id[0]}`,
        );
      }

      const classData = {
        classId: turma.Id[0],
        courseId,
        semester: turma.Semestre[0],
      };

      const classEntity = await tx.class.upsert({
        where: { classId: classData.classId },
        update: { courseId: classData.courseId, semester: classData.semester },
        create: classData,
      });

      imported.push(classEntity);
    }
    return imported;
  }

  private async importStudents(alunos: any[], tx: any): Promise<any[]> {
    const imported = [];
    for (const aluno of alunos) {
      const student = await tx.student.upsert({
        where: { ra: aluno.RA[0] },
        update: { name: aluno.Nome[0] },
        create: {
          ra: aluno.RA[0],
          name: aluno.Nome[0],
        },
      });
      imported.push(student);
    }
    return imported;
  }

  private async importEnrollments(
    notas: any[],
    students: any[],
    classes: any[],
    tx: any,
  ): Promise<any[]> {
    const studentMap = new Map(students.map((s) => [s.ra, s.id]));
    const classMap = new Map(classes.map((c) => [c.classId, c.id]));
    const imported = [];

    for (const nota of notas) {
      const ra = nota.RA[0];
      const turmaId = nota.TurmaId[0];
      const valor = parseFloat(nota.Valor[0]);

      const studentId = studentMap.get(ra);
      const classId = classMap.get(turmaId);

      if (!studentId) {
        throw new BadRequestException(`Aluno não encontrado: ${ra}`);
      }
      if (!classId) {
        throw new BadRequestException(`Turma não encontrada: ${turmaId}`);
      }

      const enrollment = await tx.enrollment.upsert({
        where: {
          studentId_classId: {
            studentId,
            classId,
          },
        },
        update: { grade: valor },
        create: {
          studentId,
          classId,
          grade: valor,
        },
      });

      imported.push(enrollment);
    }
    return imported;
  }

  async getImports(userId?: number) {
    const where = userId ? { userId } : {};
    return this.prisma.importLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  async getImportById(id: number) {
    return this.prisma.importLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  async getOriginalFile(id: number): Promise<{ buffer: Buffer; filename: string }> {
    const importLog = await this.prisma.importLog.findUnique({
      where: { id },
    });

    if (!importLog || !importLog.fileHash) {
      throw new BadRequestException('Importação não encontrada');
    }

    const filePath = path.join(this.uploadsDir, `${importLog.fileHash}.xml`);
    
    if (!fs.existsSync(filePath)) {
      throw new InternalServerErrorException('Arquivo original não encontrado');
    }

    return {
      buffer: fs.readFileSync(filePath),
      filename: importLog.fileName,
    };
  }
}

