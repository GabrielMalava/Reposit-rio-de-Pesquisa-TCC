# Instruções de Instalação e Execução

## 📋 Pré-requisitos

- Docker e Docker Compose instalados
- Node.js 20+ (para desenvolvimento local, opcional)

## 🚀 Execução com Docker (Recomendado)

### 1. Iniciar o sistema

```bash
# Construir e iniciar todos os serviços
docker-compose up --build

# Ou em background
docker-compose up -d --build
```

### 2. Executar migrações do banco de dados

```bash
# Entrar no container do backend
docker-compose exec api sh

# Executar migrações
npx prisma migrate deploy

# Criar usuário admin (opcional)
npm run prisma:seed

# Sair do container
exit
```

### 3. Acessar a aplicação

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Documentação Swagger**: http://localhost:3001/api/docs
- **Banco de Dados**: localhost:5432

### 4. Credenciais padrão

Após executar o seed:
- **Email**: admin@example.com
- **Senha**: admin123

## 🛠️ Desenvolvimento Local

### Backend

```bash
cd backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações

# Gerar Prisma Client
npx prisma generate

# Executar migrações
npx prisma migrate dev

# Criar usuário admin
npm run prisma:seed

# Iniciar servidor de desenvolvimento
npm run start:dev
```

### Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
# Criar .env.local com:
# NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Iniciar servidor de desenvolvimento
npm run dev
```

## 📝 Testando o Sistema

### 1. Fazer login

Acesse http://localhost:3000/login e faça login com as credenciais padrão.

### 2. Importar dados

1. Acesse a página de Importação
2. Use o arquivo `exemplo_importacao.xml` na raiz do projeto como exemplo
3. Faça upload do arquivo XML

### 3. Visualizar relatórios

- Acesse o Dashboard para ver KPIs gerais
- Acesse Relatórios para ver tabelas detalhadas
- Use os filtros para refinar os dados

### 4. Exportar dados

Na página de Relatórios, use os botões de exportação para baixar:
- XML consolidado
- CSV
- JSON
- PDF

## 🧪 Testes

### Backend

```bash
cd backend
npm run test        # Testes unitários
npm run test:e2e    # Testes end-to-end
```

### Frontend

```bash
cd frontend
npm run test        # Testes unitários
npm run test:e2e    # Testes Playwright
```

## 🐛 Troubleshooting

### Problemas com o banco de dados

```bash
# Recriar o banco de dados
docker-compose down -v
docker-compose up -d db
docker-compose exec api npx prisma migrate deploy
```

### Problemas com dependências

```bash
# Limpar e reinstalar
docker-compose down
docker-compose build --no-cache
docker-compose up
```

### Ver logs

```bash
# Logs de todos os serviços
docker-compose logs -f

# Logs de um serviço específico
docker-compose logs -f api
docker-compose logs -f web
docker-compose logs -f db
```

## 📚 Estrutura do Projeto

```
.
├── backend/          # API NestJS
│   ├── src/
│   │   ├── modules/  # Módulos da aplicação
│   │   ├── common/   # Componentes compartilhados
│   │   └── main.ts   # Entry point
│   ├── prisma/       # Schema e migrações do Prisma
│   └── assets/       # Arquivos estáticos (XSD)
├── frontend/         # Next.js App
│   ├── app/          # Páginas e rotas
│   ├── components/   # Componentes React
│   └── lib/          # Utilitários e configurações
└── docker-compose.yml # Configuração Docker
```

## 🔧 Configuração Avançada

### Variáveis de Ambiente do Backend

```env
DATABASE_URL=postgresql://notas_user:notas_password@db:5432/notas_db
JWT_SECRET=your-secret-key-change-in-production
PORT=3001
NODE_ENV=production
```

### Variáveis de Ambiente do Frontend

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 📄 Formato do XML

O sistema espera XMLs com a estrutura definida no arquivo `backend/assets/schema.xsd`. Veja o exemplo em `exemplo_importacao.xml`.


