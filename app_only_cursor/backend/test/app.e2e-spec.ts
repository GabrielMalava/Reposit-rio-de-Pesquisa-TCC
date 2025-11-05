import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Criar usuário de teste
    const hashedPassword = await bcrypt.hash('test123', 10);
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
      },
    });
    userId = user.id;

    // Fazer login para obter token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'test123',
      });

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    // Limpar dados de teste
    await prisma.enrollment.deleteMany({});
    await prisma.class.deleteMany({});
    await prisma.student.deleteMany({});
    await prisma.course.deleteMany({});
    await prisma.importLog.deleteMany({});
    await prisma.user.deleteMany({});
    await app.close();
  });

  describe('/auth', () => {
    it('POST /auth/register - deve criar novo usuário', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          name: 'New User',
        })
        .expect(201);
    });

    it('POST /auth/login - deve fazer login e retornar token', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'test123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('user');
        });
    });

    it('POST /auth/login - deve rejeitar credenciais inválidas', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });

  describe('/import', () => {
    const validXml = `<?xml version="1.0" encoding="UTF-8"?>
<Importacao>
  <Cursos>
    <Curso>
      <Codigo>MAT101</Codigo>
      <Nome>Matemática Básica</Nome>
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
      <Nome>João da Silva</Nome>
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

    it('POST /import/upload - deve rejeitar upload sem autenticação', () => {
      return request(app.getHttpServer())
        .post('/api/import/upload')
        .attach('file', Buffer.from(validXml), 'test.xml')
        .expect(401);
    });

    it('POST /import/upload - deve importar XML válido', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/import/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(validXml), 'test.xml')
        .expect(201);

      expect(response.body).toHaveProperty('importLog');
      expect(response.body).toHaveProperty('students');
      expect(response.body.students).toBe(1);
    });

    it('POST /import/upload - deve rejeitar arquivo não-XML', () => {
      return request(app.getHttpServer())
        .post('/api/import/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('not xml content'), 'test.txt')
        .expect(400);
    });

    it('GET /import - deve listar importações', () => {
      return request(app.getHttpServer())
        .get('/api/import')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/reports', () => {
    it('GET /reports/dashboard - deve retornar métricas do dashboard', () => {
      return request(app.getHttpServer())
        .get('/api/reports/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('totalStudents');
          expect(res.body).toHaveProperty('overallGPA');
          expect(res.body).toHaveProperty('overallApprovalRate');
        });
    });

    it('GET /reports/students - deve retornar lista de alunos', () => {
      return request(app.getHttpServer())
        .get('/api/reports/students')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /reports/classes - deve retornar lista de turmas', () => {
      return request(app.getHttpServer())
        .get('/api/reports/classes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /reports/courses - deve retornar lista de disciplinas', () => {
      return request(app.getHttpServer())
        .get('/api/reports/courses')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /reports/export/xml - deve exportar XML', () => {
      return request(app.getHttpServer())
        .get('/api/reports/export/xml')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect('Content-Type', /application\/xml/);
    });

    it('GET /reports/export/csv - deve exportar CSV', () => {
      return request(app.getHttpServer())
        .get('/api/reports/export/csv')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect('Content-Type', /text\/csv/);
    });

    it('GET /reports/export/json - deve exportar JSON', () => {
      return request(app.getHttpServer())
        .get('/api/reports/export/json')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect('Content-Type', /application\/json/);
    });

    it('GET /reports/export/pdf - deve exportar PDF', () => {
      return request(app.getHttpServer())
        .get('/api/reports/export/pdf')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect('Content-Type', /application\/pdf/);
    });
  });

  describe('/students', () => {
    it('GET /students - deve retornar lista de alunos', () => {
      return request(app.getHttpServer())
        .get('/api/students')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /students/:id - deve retornar detalhes do aluno', async () => {
      // Primeiro criar um aluno via importação
      const student = await prisma.student.create({
        data: {
          ra: '999999',
          name: 'Test Student',
        },
      });

      return request(app.getHttpServer())
        .get(`/api/students/${student.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('ra');
          expect(res.body).toHaveProperty('name');
        });
    });
  });
});

