import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MetricsCalculationService } from '../report/metrics-calculation.service';

@Injectable()
export class StudentService {
  constructor(
    private prisma: PrismaService,
    private metricsService: MetricsCalculationService,
  ) {}

  async findAll(search?: string) {
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { ra: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const students = await this.prisma.student.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    // Calcular métricas para cada aluno
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

  async findOne(id: number) {
    const student = await this.prisma.student.findUnique({
      where: { id },
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

    if (!student) {
      return null;
    }

    const metrics = await this.metricsService.calculateStudentMetrics(id);

    return {
      ...student,
      ...metrics,
    };
  }

  async getMetrics(id: number) {
    return this.metricsService.calculateStudentMetrics(id);
  }
}


