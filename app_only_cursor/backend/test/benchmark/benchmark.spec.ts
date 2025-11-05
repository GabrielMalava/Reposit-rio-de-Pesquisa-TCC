import { Test, TestingModule } from '@nestjs/testing';
import { MetricsCalculationService } from '../../src/modules/report/metrics-calculation.service';
import { PrismaService } from '../../src/modules/prisma/prisma.service';

describe('Benchmark Tests', () => {
  let service: MetricsCalculationService;
  let prisma: PrismaService;

  const mockPrismaService = {
    enrollment: {
      findMany: jest.fn(),
    },
    student: {
      findMany: jest.fn(),
    },
    course: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(() => {
    prisma = mockPrismaService as any;
    service = new MetricsCalculationService(prisma);
  });

  describe('Performance de Cálculos', () => {
    it('deve calcular métricas de 100 alunos em menos de 1 segundo', async () => {
      const students = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        ra: `RA${i + 1}`,
        name: `Aluno ${i + 1}`,
      }));

      mockPrismaService.student.findMany.mockResolvedValue(students);

      // Mock enrollments para cada aluno
      mockPrismaService.enrollment.findMany.mockImplementation(async (args) => {
        if (args?.where?.studentId) {
          return [
            {
              id: 1,
              grade: 7.5,
              class: { course: { workload: 60 } },
            },
          ];
        }
        return [];
      });

      const startTime = Date.now();

      for (const student of students) {
        await service.calculateStudentMetrics(student.id);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // 1 segundo
    });

    it('deve calcular métricas de turma com 1000 alunos em menos de 500ms', async () => {
      const enrollments = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        grade: 5 + Math.random() * 5,
        student: { id: i + 1, ra: `RA${i + 1}`, name: `Aluno ${i + 1}` },
        class: {
          id: 1,
          course: { id: 1, code: 'MAT101', name: 'Matemática' },
        },
      }));

      mockPrismaService.enrollment.findMany.mockResolvedValue(enrollments);

      const startTime = Date.now();
      await service.calculateClassMetrics(1);
      const endTime = Date.now();

      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500); // 500ms
    });
  });

  describe('Uso de Memória', () => {
    it('deve processar grandes volumes sem vazamento de memória', async () => {
      const largeEnrollments = Array.from({ length: 10000 }, (_, i) => ({
        id: i + 1,
        grade: 5 + Math.random() * 5,
        student: { id: Math.floor(i / 10) + 1, ra: `RA${i}`, name: `Aluno ${i}` },
        class: {
          id: 1,
          course: { id: 1, code: 'MAT101', name: 'Matemática' },
        },
      }));

      mockPrismaService.enrollment.findMany.mockResolvedValue(largeEnrollments);

      const initialMemory = process.memoryUsage().heapUsed;

      // Executar múltiplas vezes
      for (let i = 0; i < 10; i++) {
        await service.calculateClassMetrics(1);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Aumento de memória não deve ser excessivo (menos de 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Concorrência', () => {
    it('deve processar múltiplos cálculos em paralelo', async () => {
      const students = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        ra: `RA${i + 1}`,
        name: `Aluno ${i + 1}`,
      }));

      mockPrismaService.student.findMany.mockResolvedValue(students);
      mockPrismaService.enrollment.findMany.mockResolvedValue([
        {
          id: 1,
          grade: 7.5,
          class: { course: { workload: 60 } },
        },
      ]);

      const startTime = Date.now();

      // Executar cálculos em paralelo
      await Promise.all(
        students.map((student) => service.calculateStudentMetrics(student.id))
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Paralelo deve ser mais rápido que sequencial
      expect(duration).toBeLessThan(2000); // 2 segundos para 50 alunos em paralelo
    });
  });
});

