import { MetricsCalculationService } from '../../src/modules/report/metrics-calculation.service';
import { PrismaService } from '../../src/modules/prisma/prisma.service';

describe('Accuracy Tests - Cálculos de Métricas', () => {
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

  describe('Precisão do GPA', () => {
    it('deve calcular GPA com precisão de 2 casas decimais', async () => {
      const enrollments = [
        {
          id: 1,
          grade: 8.333,
          class: { course: { workload: 60 } },
        },
        {
          id: 2,
          grade: 7.777,
          class: { course: { workload: 80 } },
        },
      ];

      mockPrismaService.enrollment.findMany.mockResolvedValue(enrollments);

      const result = await service.calculateStudentMetrics(1);

      // GPA = (8.333 * 60 + 7.777 * 80) / 140 = 7.999
      // Deve ser arredondado para 2 casas: 8.00
      expect(result.gpa).toBe(8.0);
      expect(result.gpa.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
    });

    it('deve calcular GPA exato para notas inteiras', async () => {
      const enrollments = [
        {
          id: 1,
          grade: 8.0,
          class: { course: { workload: 100 } },
        },
        {
          id: 2,
          grade: 7.0,
          class: { course: { workload: 100 } },
        },
      ];

      mockPrismaService.enrollment.findMany.mockResolvedValue(enrollments);

      const result = await service.calculateStudentMetrics(1);

      // GPA = (8 * 100 + 7 * 100) / 200 = 7.5
      expect(result.gpa).toBe(7.5);
    });
  });

  describe('Precisão das Médias', () => {
    it('deve calcular média de turma com precisão correta', async () => {
      const enrollments = [
        { id: 1, grade: 8.5, student: {}, class: { course: {} } },
        { id: 2, grade: 7.5, student: {}, class: { course: {} } },
        { id: 3, grade: 6.5, student: {}, class: { course: {} } },
      ];

      mockPrismaService.enrollment.findMany.mockResolvedValue(enrollments);

      const result = await service.calculateClassMetrics(1);

      // Média: (8.5 + 7.5 + 6.5) / 3 = 7.5
      expect(result.average).toBe(7.5);
      expect(result.average.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
    });

    it('deve calcular desvio padrão corretamente', async () => {
      const enrollments = [
        { id: 1, grade: 10.0, student: {}, class: { course: {} } },
        { id: 2, grade: 5.0, student: {}, class: { course: {} } },
        { id: 3, grade: 7.5, student: {}, class: { course: {} } },
      ];

      mockPrismaService.enrollment.findMany.mockResolvedValue(enrollments);

      const result = await service.calculateClassMetrics(1);

      // Média: 7.5
      // Variância: ((10-7.5)² + (5-7.5)² + (7.5-7.5)²) / 3 = 4.167
      // Desvio padrão: √4.167 = 2.04
      expect(result.standardDeviation).toBeCloseTo(2.04, 2);
    });
  });

  describe('Precisão da Taxa de Aprovação', () => {
    it('deve calcular taxa de aprovação com precisão de 2 casas decimais', async () => {
      const enrollments = [
        { id: 1, grade: 8.0, student: {}, class: { course: {} } },
        { id: 2, grade: 7.0, student: {}, class: { course: {} } },
        { id: 3, grade: 5.0, student: {}, class: { course: {} } },
        { id: 4, grade: 6.0, student: {}, class: { course: {} } },
      ];

      mockPrismaService.enrollment.findMany.mockResolvedValue(enrollments);

      const result = await service.calculateClassMetrics(1);

      // Taxa: 3/4 = 75%
      expect(result.approvalRate).toBe(75.0);
      expect(result.approvalRate.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
    });

    it('deve tratar caso limite: todas notas aprovadas', async () => {
      const enrollments = [
        { id: 1, grade: 6.0, student: {}, class: { course: {} } },
        { id: 2, grade: 7.0, student: {}, class: { course: {} } },
        { id: 3, grade: 8.0, student: {}, class: { course: {} } },
      ];

      mockPrismaService.enrollment.findMany.mockResolvedValue(enrollments);

      const result = await service.calculateClassMetrics(1);

      expect(result.approvalRate).toBe(100.0);
    });

    it('deve tratar caso limite: todas notas reprovadas', async () => {
      const enrollments = [
        { id: 1, grade: 5.0, student: {}, class: { course: {} } },
        { id: 2, grade: 4.0, student: {}, class: { course: {} } },
        { id: 3, grade: 3.0, student: {}, class: { course: {} } },
      ];

      mockPrismaService.enrollment.findMany.mockResolvedValue(enrollments);

      const result = await service.calculateClassMetrics(1);

      expect(result.approvalRate).toBe(0.0);
    });
  });

  describe('Precisão da Situação do Aluno', () => {
    it('deve classificar corretamente aluno aprovado', async () => {
      const enrollments = [
        {
          id: 1,
          grade: 7.0,
          class: { course: { workload: 60 } },
        },
        {
          id: 2,
          grade: 8.0,
          class: { course: { workload: 80 } },
        },
      ];

      mockPrismaService.enrollment.findMany.mockResolvedValue(enrollments);

      const result = await service.calculateStudentMetrics(1);

      expect(result.overallStatus).toBe('Aprovado');
      expect(result.gpa).toBeGreaterThanOrEqual(6.0);
      expect(result.disciplines.every((d) => d.status === 'Aprovado')).toBe(true);
    });

    it('deve classificar corretamente aluno reprovado por média baixa', async () => {
      const enrollments = [
        {
          id: 1,
          grade: 5.0,
          class: { course: { workload: 60 } },
        },
        {
          id: 2,
          grade: 5.5,
          class: { course: { workload: 80 } },
        },
      ];

      mockPrismaService.enrollment.findMany.mockResolvedValue(enrollments);

      const result = await service.calculateStudentMetrics(1);

      expect(result.overallStatus).toBe('Reprovado');
      expect(result.gpa).toBeLessThan(6.0);
    });

    it('deve classificar corretamente aluno reprovado por disciplina reprovada', async () => {
      const enrollments = [
        {
          id: 1,
          grade: 5.0, // Reprovado
          class: { course: { workload: 60 } },
        },
        {
          id: 2,
          grade: 9.0, // Aprovado
          class: { course: { workload: 80 } },
        },
      ];

      mockPrismaService.enrollment.findMany.mockResolvedValue(enrollments);

      const result = await service.calculateStudentMetrics(1);

      // GPA = (5*60 + 9*80)/140 = 7.29 (>= 6)
      expect(result.gpa).toBeGreaterThanOrEqual(6.0);
      // Mas tem disciplina reprovada
      expect(result.overallStatus).toBe('Reprovado');
      expect(result.disciplines.some((d) => d.status === 'Reprovado')).toBe(true);
    });
  });

  describe('Casos Especiais', () => {
    it('deve tratar divisão por zero (sem carga horária)', async () => {
      const enrollments = [
        {
          id: 1,
          grade: 8.0,
          class: { course: { workload: 0 } },
        },
      ];

      mockPrismaService.enrollment.findMany.mockResolvedValue(enrollments);

      const result = await service.calculateStudentMetrics(1);

      expect(result.gpa).toBe(0);
    });

    it('deve tratar notas no limite (exatamente 6.0)', async () => {
      const enrollments = [
        {
          id: 1,
          grade: 6.0,
          class: { course: { workload: 60 } },
        },
      ];

      mockPrismaService.enrollment.findMany.mockResolvedValue(enrollments);

      const result = await service.calculateStudentMetrics(1);

      expect(result.gpa).toBe(6.0);
      expect(result.overallStatus).toBe('Aprovado');
      expect(result.disciplines[0].status).toBe('Aprovado');
    });

    it('deve tratar notas no limite (exatamente 5.99)', async () => {
      const enrollments = [
        {
          id: 1,
          grade: 5.99,
          class: { course: { workload: 60 } },
        },
      ];

      mockPrismaService.enrollment.findMany.mockResolvedValue(enrollments);

      const result = await service.calculateStudentMetrics(1);

      expect(result.gpa).toBeCloseTo(5.99, 2);
      expect(result.overallStatus).toBe('Reprovado');
      expect(result.disciplines[0].status).toBe('Reprovado');
    });
  });
});

