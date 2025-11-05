# Sistema de Gestão de Notas Acadêmicas

Sistema web full-stack para gestão de notas acadêmicas, com suporte a importação de dados via XML, geração de relatórios e exportação em múltiplos formatos.

## Tecnologias Utilizadas

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: NestJS, TypeScript, Prisma ORM
- **Banco de Dados**: PostgreSQL 16
- **Containerização**: Docker e docker-compose

## Pré-requisitos

- Docker e docker-compose instalados
- Node.js 20 (para desenvolvimento local)
- Git

## Instalação e Execução

1. Clone o repositório:
   ```bash
   git clone <seu-repositorio>
   cd academic-grade-system
   ```

2. Configure as variáveis de ambiente:
   ```bash
   # Na raiz do projeto
   cp .env.example .env
   ```

3. Inicie os containers:
   ```bash
   docker-compose up --build
   ```

4. O sistema estará disponível em:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001
   - Banco de dados: localhost:5432

## Desenvolvimento Local

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

### Backend (NestJS)

```bash
cd backend
npm install
npm run start:dev
```

### Banco de Dados

Para executar migrações do Prisma:
```bash
cd backend
npx prisma migrate dev
```

## Testes

### Frontend (Playwright)
```bash
cd frontend
npm run test:e2e
```

### Backend (Jest)
```bash
cd backend
npm run test
```

## Funcionalidades

1. Upload e validação de arquivos XML
2. Dashboard com KPIs acadêmicos
3. Relatórios detalhados por aluno/disciplina
4. Exportação de dados em múltiplos formatos
5. Sistema de autenticação
6. Histórico de importações

## Estrutura do Projeto

```
.
├── frontend/                # Aplicação Next.js
│   ├── app/                # Páginas e componentes
│   ├── components/         # Componentes React
│   └── public/            # Arquivos estáticos
├── backend/               # API NestJS
│   ├── src/              # Código fonte
│   ├── prisma/           # Modelos e migrações
│   └── test/            # Testes
└── docker/              # Configurações Docker
```

## Documentação Adicional

- [Documentação da API](docs/api.md)
- [Guia de Desenvolvimento](docs/development.md)
- [Especificações do XML](docs/xml-specs.md)

## Suporte

Para suporte, entre em contato via [email/issues].