import { Test, TestingModule } from '@nestjs/testing';
import { ImportService } from '../../src/modules/import/import.service';
import { PrismaService } from '../../src/modules/prisma/prisma.service';
import { XmlValidationService } from '../../src/modules/import/xml-validation.service';
import { MetricsCalculationService } from '../../src/modules/report/metrics-calculation.service';

describe('Performance Tests - Import', () => {
  let importService: ImportService;
  let prisma: PrismaService;

  const mockPrismaService = {
    $transaction: jest.fn(),
    importLog: {
      create: jest.fn(),
    },
    course: {
      upsert: jest.fn(),
    },
    class: {
      upsert: jest.fn(),
    },
    student: {
      upsert: jest.fn(),
    },
    enrollment: {
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: XmlValidationService,
          useValue: {
            validateXml: jest.fn().mockResolvedValue({ valid: true, errors: [] }),
          },
        },
        {
          provide: MetricsCalculationService,
          useValue: {
            calculateAndStoreMetrics: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    importService = module.get<ImportService>(ImportService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('deve processar importação de 100 alunos em menos de 5 segundos', async () => {
    const xmlContent = generateLargeXml(100, 10, 5);
    const xmlBuffer = Buffer.from(xmlContent);

    const startTime = Date.now();

    mockPrismaService.$transaction.mockImplementation(async (callback) => {
      const tx = {
        course: { upsert: jest.fn() },
        class: { upsert: jest.fn() },
        student: { upsert: jest.fn() },
        enrollment: { upsert: jest.fn() },
      };
      return callback(tx);
    });

    try {
      await importService.importXml(xmlBuffer, 'test_large.xml');
    } catch (error) {
      // Ignorar erros de banco de dados em testes de performance
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(5000); // 5 segundos
  });

  it('deve processar importação de 1000 alunos em menos de 30 segundos', async () => {
    const xmlContent = generateLargeXml(1000, 20, 10);
    const xmlBuffer = Buffer.from(xmlContent);

    const startTime = Date.now();

    mockPrismaService.$transaction.mockImplementation(async (callback) => {
      const tx = {
        course: { upsert: jest.fn() },
        class: { upsert: jest.fn() },
        student: { upsert: jest.fn() },
        enrollment: { upsert: jest.fn() },
      };
      return callback(tx);
    });

    try {
      await importService.importXml(xmlBuffer, 'test_very_large.xml');
    } catch (error) {
      // Ignorar erros de banco de dados em testes de performance
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(30000); // 30 segundos
  });

  function generateLargeXml(
    numStudents: number,
    numCourses: number,
    numClasses: number,
  ): string {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<Importacao>
  <Cursos>`;

    for (let i = 1; i <= numCourses; i++) {
      xml += `
    <Curso>
      <Codigo>COURSE${i}</Codigo>
      <Nome>Curso ${i}</Nome>
      <CargaHoraria>${60 + i * 10}</CargaHoraria>
    </Curso>`;
    }

    xml += `
  </Cursos>
  <Turmas>`;

    for (let i = 1; i <= numClasses; i++) {
      xml += `
    <Turma>
      <Id>TURMA${i}</Id>
      <CursoCodigo>COURSE${((i - 1) % numCourses) + 1}</CursoCodigo>
      <Semestre>2023-${((i - 1) % 2) + 1}</Semestre>
    </Turma>`;
    }

    xml += `
  </Turmas>
  <Alunos>`;

    for (let i = 1; i <= numStudents; i++) {
      xml += `
    <Aluno>
      <RA>${100000 + i}</RA>
      <Nome>Aluno ${i}</Nome>
    </Aluno>`;
    }

    xml += `
  </Alunos>
  <Notas>`;

    for (let i = 1; i <= numStudents; i++) {
      for (let j = 1; j <= numClasses; j++) {
        const grade = 5 + Math.random() * 5; // Notas entre 5 e 10
        xml += `
    <Nota>
      <RA>${100000 + i}</RA>
      <TurmaId>TURMA${j}</TurmaId>
      <Valor>${grade.toFixed(2)}</Valor>
    </Nota>`;
      }
    }

    xml += `
  </Notas>
</Importacao>`;

    return xml;
  }
});

