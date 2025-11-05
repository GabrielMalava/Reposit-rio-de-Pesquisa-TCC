import { Test, TestingModule } from '@nestjs/testing';
import { MetricsCalculationService } from './metrics-calculation.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MetricsCalculationService', () => {
  let service: MetricsCalculationService;
  let prisma: PrismaService;

  const mockPrismaService = {
    student: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    enrollment: {
      findMany: jest.fn(),
    },
    course: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    class: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsCalculationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MetricsCalculationService>(MetricsCalculationService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateStudentMetrics', () => {
    it('deve calcular GPA ponderado corretamente', async () => {
      const mockEnrollments = [
        {
          id: 1,
          grade: 8.0,
          studentId: 1,
          classId: 1,
          class: {
            id: 1,
            course: {
              id: 1,
              code: 'MAT101',
              name: 'Matemática',
              workload: 60,
            },
          },
        },
        {
          id: 2,
          grade: 7.0,
          studentId: 1,
          classId: 2,
          class: {
            id: 2,
            course: {
              id: 2,
              code: 'PROG101',
              name: 'Programação',
              workload: 80,
            },
          },
        },
      ];

      mockPrismaService.enrollment.findMany.mockResolvedValue(mockEnrollments);

      const result = await service.calculateStudentMetrics(1);

      // GPA esperado: (8.0 * 60 + 7.0 * 80) / (60 + 80) = (480 + 560) / 140 = 7.43
      expect(result.gpa).toBeCloseTo(7.43, 2);
      expect(result.overallStatus).toBe('Aprovado');
      expect(result.disciplines).toHaveLength(2);
    });

    it('deve retornar Reprovado quando GPA < 6', async () => {
      const mockEnrollments = [
        {
          id: 1,
          grade: 5.0,
          studentId: 1,
          classId: 1,
          class: {
            id: 1,
            course: {
              id: 1,
              code: 'MAT101',
              name: 'Matemática',
              workload: 60,
            },
          },
        },
        {
          id: 2,
          grade: 5.5,
          studentId: 1,
          classId: 2,
          class: {
            id: 2,
            course: {
              id: 2,
              code: 'PROG101',
              name: 'Programação',
              workload: 80,
            },
          },
        },
      ];

      mockPrismaService.enrollment.findMany.mockResolvedValue(mockEnrollments);

      const result = await service.calculateStudentMetrics(1);

      expect(result.gpa).toBeLessThan(6);
      expect(result.overallStatus).toBe('Reprovado');
    });

    it('deve retornar Reprovado quando aluno tem disciplina reprovada mesmo com GPA >= 6', async () => {
      const mockEnrollments = [
        {
          id: 1,
          grade: 5.0, // Reprovado
          studentId: 1,
          classId: 1,
          class: {
            id: 1,
            course: {
              id: 1,
              code: 'MAT101',
              name: 'Matemática',
              workload: 60,
            },
          },
        },
        {
          id: 2,
          grade: 9.0, // Aprovado
          studentId: 1,
          classId: 2,
          class: {
            id: 2,
            course: {
              id: 2,
              code: 'PROG101',
              name: 'Programação',
              workload: 80,
            },
          },
        },
      ];

      mockPrismaService.enrollment.findMany.mockResolvedValue(mockEnrollments);

      const result = await service.calculateStudentMetrics(1);

      // GPA = (5.0 * 60 + 9.0 * 80) / 140 = 7.29
      expect(result.gpa).toBeGreaterThanOrEqual(6);
      expect(result.overallStatus).toBe('Reprovado'); // Por ter disciplina reprovada
      expect(result.disciplines.some((d) => d.status === 'Reprovado')).toBe(true);
    });

    it('deve retornar valores padrão quando aluno não tem matrículas', async () => {
      mockPrismaService.enrollment.findMany.mockResolvedValue([]);

      const result = await service.calculateStudentMetrics(1);

      expect(result.gpa).toBe(0);
      expect(result.overallStatus).toBe('N/A');
      expect(result.disciplines).toHaveLength(0);
    });

    it('deve calcular status de cada disciplina corretamente', async () => {
      const mockEnrollments = [
        {
          id: 1,
          grade: 6.0,
          studentId: 1,
          classId: 1,
          class: {
            id: 1,
            course: {
              id: 1,
              code: 'MAT101',
              name: 'Matemática',
              workload: 60,
            },
            semester: '2023-1',
          },
        },
        {
          id: 2,
          grade: 5.9,
          studentId: 1,
          classId: 2,
          class: {
            id: 2,
            course: {
              id: 2,
              code: 'PROG101',
              name: 'Programação',
              workload: 80,
            },
            semester: '2023-1',
          },
        },
      ];

      mockPrismaService.enrollment.findMany.mockResolvedValue(mockEnrollments);

      const result = await service.calculateStudentMetrics(1);

      const matDisc = result.disciplines.find((d) => d.courseCode === 'MAT101');
      const progDisc = result.disciplines.find((d) => d.courseCode === 'PROG101');

      expect(matDisc?.status).toBe('Aprovado');
      expect(progDisc?.status).toBe('Reprovado');
    });
  });

  describe('calculateClassMetrics', () => {
    it('deve calcular média, desvio padrão e taxa de aprovação corretamente', async () => {
      const mockEnrollments = [
        {
          id: 1,
          grade: 8.0,
          studentId: 1,
          classId: 1,
          student: { id: 1, ra: '123', name: 'Aluno 1' },
          class: {
            id: 1,
            course: { id: 1, code: 'MAT101', name: 'Matemática' },
          },
        },
        {
          id: 2,
          grade: 7.0,
          studentId: 2,
          classId: 1,
          student: { id: 2, ra: '456', name: 'Aluno 2' },
          class: {
            id: 1,
            course: { id: 1, code: 'MAT101', name: 'Matemática' },
          },
        },
        {
          id: 3,
          grade: 5.0,
          studentId: 3,
          classId: 1,
          student: { id: 3, ra: '789', name: 'Aluno 3' },
          class: {
            id: 1,
            course: { id: 1, code: 'MAT101', name: 'Matemática' },
          },
        },
      ];

      mockPrismaService.enrollment.findMany.mockResolvedValue(mockEnrollments);

      const result = await service.calculateClassMetrics(1);

      // Média: (8 + 7 + 5) / 3 = 6.67
      expect(result.average).toBeCloseTo(6.67, 2);
      // Taxa de aprovação: 2/3 = 66.67%
      expect(result.approvalRate).toBeCloseTo(66.67, 2);
      expect(result.totalStudents).toBe(3);
      expect(result.standardDeviation).toBeGreaterThan(0);
    });

    it('deve retornar valores padrão quando turma não tem alunos', async () => {
      mockPrismaService.enrollment.findMany.mockResolvedValue([]);

      const result = await service.calculateClassMetrics(1);

      expect(result.average).toBe(0);
      expect(result.standardDeviation).toBe(0);
      expect(result.approvalRate).toBe(0);
      expect(result.totalStudents).toBe(0);
    });
  });

  describe('calculateCourseMetrics', () => {
    it('deve calcular métricas agregadas de todas as turmas de uma disciplina', async () => {
      const mockCourse = {
        id: 1,
        code: 'MAT101',
        name: 'Matemática',
        workload: 60,
        classes: [
          {
            id: 1,
            enrollments: [
              { id: 1, grade: 8.0 },
              { id: 2, grade: 7.0 },
            ],
          },
          {
            id: 2,
            enrollments: [
              { id: 3, grade: 6.0 },
              { id: 4, grade: 9.0 },
            ],
          },
        ],
      };

      mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);

      const result = await service.calculateCourseMetrics('MAT101');

      // Média: (8 + 7 + 6 + 9) / 4 = 7.5
      expect(result.average).toBe(7.5);
      // Taxa de aprovação: 4/4 = 100%
      expect(result.approvalRate).toBe(100);
      expect(result.totalStudents).toBe(4);
    });

    it('deve retornar valores padrão quando disciplina não existe', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(null);

      const result = await service.calculateCourseMetrics('INVALID');

      expect(result.average).toBe(0);
      expect(result.standardDeviation).toBe(0);
      expect(result.approvalRate).toBe(0);
      expect(result.totalStudents).toBe(0);
    });
  });

  describe('calculateOverallMetrics', () => {
    it('deve calcular métricas gerais do sistema', async () => {
      const mockStudents = [
        { id: 1, ra: '123', name: 'Aluno 1' },
        { id: 2, ra: '456', name: 'Aluno 2' },
      ];

      const mockEnrollments = [
        { id: 1, grade: 8.0 },
        { id: 2, grade: 7.0 },
        { id: 3, grade: 5.0 },
        { id: 4, grade: 9.0 },
      ];

      mockPrismaService.student.findMany.mockResolvedValue(mockStudents);
      mockPrismaService.enrollment.findMany.mockResolvedValue(mockEnrollments);

      // Mock para calcularStudentMetrics
      mockPrismaService.enrollment.findMany
        .mockResolvedValueOnce([
          {
            id: 1,
            grade: 8.0,
            class: { course: { workload: 60 } },
          },
        ])
        .mockResolvedValueOnce([
          {
            id: 2,
            grade: 7.0,
            class: { course: { workload: 80 } },
          },
        ])
        .mockResolvedValue(mockEnrollments); // Para o findMany final

      const result = await service.calculateOverallMetrics();

      expect(result.totalStudents).toBe(2);
      expect(result.overallGPA).toBeGreaterThan(0);
      expect(result.overallApprovalRate).toBeGreaterThanOrEqual(0);
      expect(result.overallApprovalRate).toBeLessThanOrEqual(100);
    });
  });
});

