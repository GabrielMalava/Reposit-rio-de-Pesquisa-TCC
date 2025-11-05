import { Test, TestingModule } from '@nestjs/testing';
import { XmlValidationService } from './xml-validation.service';

describe('XmlValidationService', () => {
  let service: XmlValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [XmlValidationService],
    }).compile();

    service = module.get<XmlValidationService>(XmlValidationService);
  });

  describe('validateXml', () => {
    it('deve validar XML válido corretamente', async () => {
      const validXml = `<?xml version="1.0" encoding="UTF-8"?>
<Importacao>
  <Cursos>
    <Curso>
      <Codigo>MAT101</Codigo>
      <Nome>Matemática</Nome>
      <CargaHoraria>60</CargaHoraria>
    </Curso>
  </Cursos>
  <Turmas>
    <Turma>
      <Id>TUR001</Id>
      <CursoCodigo>MAT101</CursoCodigo>
      <Semestre>2023-1</Semestre>
    </Turma>
  </Turmas>
  <Alunos>
    <Aluno>
      <RA>123456</RA>
      <Nome>João Silva</Nome>
    </Aluno>
  </Alunos>
  <Notas>
    <Nota>
      <RA>123456</RA>
      <TurmaId>TUR001</TurmaId>
      <Valor>7.5</Valor>
    </Nota>
  </Notas>
</Importacao>`;

      const result = await service.validateXml(validXml);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('deve rejeitar XML sem elemento raiz Importacao', async () => {
      const invalidXml = `<?xml version="1.0"?>
<Root>
  <Cursos></Cursos>
</Root>`;

      const result = await service.validateXml(invalidXml);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Importacao');
    });

    it('deve rejeitar XML sem seção Cursos', async () => {
      const invalidXml = `<?xml version="1.0"?>
<Importacao>
  <Turmas></Turmas>
  <Alunos></Alunos>
  <Notas></Notas>
</Importacao>`;

      const result = await service.validateXml(invalidXml);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Cursos'))).toBe(true);
    });

    it('deve rejeitar XML com curso sem código', async () => {
      const invalidXml = `<?xml version="1.0"?>
<Importacao>
  <Cursos>
    <Curso>
      <Nome>Matemática</Nome>
      <CargaHoraria>60</CargaHoraria>
    </Curso>
  </Cursos>
  <Turmas></Turmas>
  <Alunos></Alunos>
  <Notas></Notas>
</Importacao>`;

      const result = await service.validateXml(invalidXml);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Codigo'))).toBe(true);
    });

    it('deve rejeitar XML com nota fora do intervalo 0-10', async () => {
      const invalidXml = `<?xml version="1.0"?>
<Importacao>
  <Cursos>
    <Curso>
      <Codigo>MAT101</Codigo>
      <Nome>Matemática</Nome>
      <CargaHoraria>60</CargaHoraria>
    </Curso>
  </Cursos>
  <Turmas>
    <Turma>
      <Id>TUR001</Id>
      <CursoCodigo>MAT101</CursoCodigo>
      <Semestre>2023-1</Semestre>
    </Turma>
  </Turmas>
  <Alunos>
    <Aluno>
      <RA>123456</RA>
      <Nome>João</Nome>
    </Aluno>
  </Alunos>
  <Notas>
    <Nota>
      <RA>123456</RA>
      <TurmaId>TUR001</TurmaId>
      <Valor>15.0</Valor>
    </Nota>
  </Notas>
</Importacao>`;

      const result = await service.validateXml(invalidXml);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('0 e 10'))).toBe(true);
    });

    it('deve rejeitar XML malformado', async () => {
      const invalidXml = `<?xml version="1.0"?>
<Importacao>
  <Cursos>
    <Curso>
      <Codigo>MAT101</Codigo>
      <Nome>Matemática</Nome>
      <!-- Tag não fechada
    </Curso>
  </Cursos>
</Importacao>`;

      const result = await service.validateXml(invalidXml);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('deve validar XML com múltiplos registros', async () => {
      const validXml = `<?xml version="1.0" encoding="UTF-8"?>
<Importacao>
  <Cursos>
    <Curso>
      <Codigo>MAT101</Codigo>
      <Nome>Matemática</Nome>
      <CargaHoraria>60</CargaHoraria>
    </Curso>
    <Curso>
      <Codigo>PROG101</Codigo>
      <Nome>Programação</Nome>
      <CargaHoraria>80</CargaHoraria>
    </Curso>
  </Cursos>
  <Turmas>
    <Turma>
      <Id>TUR001</Id>
      <CursoCodigo>MAT101</CursoCodigo>
      <Semestre>2023-1</Semestre>
    </Turma>
    <Turma>
      <Id>TUR002</Id>
      <CursoCodigo>PROG101</CursoCodigo>
      <Semestre>2023-1</Semestre>
    </Turma>
  </Turmas>
  <Alunos>
    <Aluno>
      <RA>123456</RA>
      <Nome>João Silva</Nome>
    </Aluno>
    <Aluno>
      <RA>234567</RA>
      <Nome>Maria Santos</Nome>
    </Aluno>
  </Alunos>
  <Notas>
    <Nota>
      <RA>123456</RA>
      <TurmaId>TUR001</TurmaId>
      <Valor>7.5</Valor>
    </Nota>
    <Nota>
      <RA>123456</RA>
      <TurmaId>TUR002</TurmaId>
      <Valor>8.0</Valor>
    </Nota>
    <Nota>
      <RA>234567</RA>
      <TurmaId>TUR001</TurmaId>
      <Valor>9.0</Valor>
    </Nota>
  </Notas>
</Importacao>`;

      const result = await service.validateXml(validXml);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});

