# Sistema Web Full-Stack de Gestão de Notas Acadêmicas

Sistema completo para importação, processamento e visualização de notas acadêmicas com upload de XML, validação XSD, cálculos de métricas e relatórios.

## 🚀 Stack Tecnológico

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: NestJS, Node.js 20, TypeScript
- **Banco de Dados**: PostgreSQL 16 com Prisma ORM
- **Containerização**: Docker + Docker Compose
- **Testes**: Jest (backend), Playwright (frontend)
- **Qualidade**: ESLint, Prettier, Husky, lint-staged

## 📋 Funcionalidades

- ✅ Upload e validação de arquivos XML (com validação XSD)
- ✅ Parse e persistência de dados no PostgreSQL
- ✅ Cálculos de métricas acadêmicas (GPA, médias, aprovação/reprovação)
- ✅ Dashboard com KPIs e visualizações gráficas
- ✅ Relatórios por aluno, turma e disciplina
- ✅ Exportação em XML, CSV, JSON e PDF
- ✅ Histórico de importações e auditoria
- ✅ Autenticação JWT (opcional)

## 🛠️ Instalação e Execução

### Pré-requisitos

- Docker e Docker Compose instalados
- Node.js 20+ (para desenvolvimento local)

### Executar com Docker

```bash
# Construir e iniciar todos os serviços
docker-compose up --build

# Executar em background
docker-compose up -d

# Parar os serviços
docker-compose down

# Ver logs
docker-compose logs -f
```

### Acessar a aplicação

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Banco de Dados**: localhost:5432

### Desenvolvimento Local

#### Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 📁 Estrutura do Projeto

```
.
├── backend/          # API NestJS
│   ├── src/
│   │   ├── modules/
│   │   ├── common/
│   │   └── main.ts
│   ├── prisma/
│   ├── assets/
│   └── Dockerfile
├── frontend/         # Next.js App
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── Dockerfile
└── docker-compose.yml
```

## 📝 Formato do XML de Entrada

O sistema espera XMLs com a seguinte estrutura:

```xml
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
</Importacao>
```

## 🧪 Testes

```bash
# Backend
cd backend
npm run test
npm run test:e2e

# Frontend
cd frontend
npm run test
npm run test:e2e
```

## 📄 Licença

Este projeto foi desenvolvido para fins acadêmicos.


