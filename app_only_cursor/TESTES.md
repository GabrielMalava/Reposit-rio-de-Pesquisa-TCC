# Guia de Execução de Testes

Este documento explica como executar todos os testes do sistema para medir acurácia e desempenho.

## 📋 Tipos de Testes

1. **Testes Unitários** - Testam funções individuais
2. **Testes de Integração E2E** - Testam fluxos completos da API
3. **Testes de Performance** - Medem tempo de execução
4. **Testes de Acurácia** - Verificam precisão dos cálculos
5. **Testes de Benchmark** - Medem uso de recursos
6. **Testes E2E Frontend** - Testam interface completa

## 🚀 Execução Rápida

### Executar Todos os Testes do Backend

```bash
cd backend
npm install  # Se ainda não instalou
npm test
```

### Executar Testes Específicos

```bash
cd backend

# Apenas testes unitários
npm run test

# Apenas testes E2E
npm run test:e2e

# Testes de performance
npm run test -- performance/import-performance.spec.ts

# Testes de acurácia
npm run test -- accuracy/calculations-accuracy.spec.ts

# Testes de benchmark
npm run test -- benchmark/benchmark.spec.ts

# Com cobertura de código
npm run test:cov
```

### Executar Testes do Frontend

```bash
cd frontend
npm install  # Se ainda não instalou

# Testes E2E com Playwright
npm run test:e2e

# Abrir relatório visual
npx playwright show-report
```

## 📊 Testes Detalhados

### 1. Testes Unitários - Cálculos de Métricas

Testa a precisão dos cálculos de GPA, médias e aprovação.

```bash
cd backend
npm run test -- metrics-calculation.service.spec.ts
```

**O que verifica:**
- ✅ Cálculo correto do GPA ponderado
- ✅ Classificação de aprovação/reprovação
- ✅ Status por disciplina
- ✅ Casos limites (notas = 6.0, 5.99)

### 2. Testes de Validação XML

Testa a validação de arquivos XML.

```bash
cd backend
npm run test -- xml-validation.service.spec.ts
```

**O que verifica:**
- ✅ Aceita XML válido
- ✅ Rejeita XML malformado
- ✅ Valida estrutura obrigatória
- ✅ Valida notas entre 0-10

### 3. Testes de Integração E2E

Testa endpoints completos da API.

```bash
cd backend

# IMPORTANTE: Certifique-se de que o banco está rodando
docker-compose up -d db

# Executar migrações
npm run prisma:migrate

# Executar testes
npm run test:e2e
```

**O que verifica:**
- ✅ Autenticação (login/register)
- ✅ Upload de XML
- ✅ Endpoints de relatórios
- ✅ Exportação de dados

### 4. Testes de Performance

Mede tempo de processamento.

```bash
cd backend
npm run test -- performance/import-performance.spec.ts
```

**O que verifica:**
- ⚡ 100 alunos em < 5 segundos
- ⚡ 1000 alunos em < 30 segundos

### 5. Testes de Acurácia

Verifica precisão dos cálculos.

```bash
cd backend
npm run test -- accuracy/calculations-accuracy.spec.ts
```

**O que verifica:**
- 🎯 Precisão de 2 casas decimais
- 🎯 Cálculo exato de médias
- 🎯 Desvio padrão correto
- 🎯 Taxa de aprovação precisa

### 6. Testes de Benchmark

Mede uso de recursos.

```bash
cd backend
npm run test -- benchmark/benchmark.spec.ts
```

**O que verifica:**
- 📈 100 alunos em < 1 segundo
- 📈 1000 alunos em < 500ms
- 📈 Uso de memória < 50MB para 10k registros

### 7. Testes E2E Frontend

Testa interface completa.

```bash
cd frontend

# IMPORTANTE: Backend e frontend devem estar rodando
# Terminal 1: Backend
cd ../backend
npm run start:dev

# Terminal 2: Frontend
cd ../frontend
npm run dev

# Terminal 3: Testes
npm run test:e2e
```

**O que verifica:**
- ✅ Fluxo de login
- ✅ Upload de arquivo
- ✅ Visualização de dashboard
- ✅ Exportação de dados

## 📈 Relatórios de Cobertura

### Gerar Relatório de Cobertura

```bash
cd backend
npm run test:cov

# Abrir relatório
open coverage/lcov-report/index.html
# ou no Linux
xdg-open coverage/lcov-report/index.html
```

### Visualizar Relatório Playwright

```bash
cd frontend
npx playwright show-report
```

## 🔧 Executar Todos os Testes de Uma Vez

### Opção 1: Script Automático

```bash
cd backend/test
./run-all-tests.sh
```

### Opção 2: Manual

```bash
cd backend

# 1. Testes unitários
npm run test

# 2. Testes E2E (requer banco rodando)
docker-compose up -d db
npm run prisma:migrate
npm run test:e2e

# 3. Testes específicos
npm run test -- performance/import-performance.spec.ts
npm run test -- accuracy/calculations-accuracy.spec.ts
npm run test -- benchmark/benchmark.spec.ts
```

## 📊 Interpretando Resultados

### Testes de Acurácia

✅ **Passou**: Cálculos estão corretos
❌ **Falhou**: Verificar lógica de cálculo

Exemplo de saída:
```
✓ deve calcular GPA ponderado corretamente
✓ deve calcular média de turma com precisão correta
```

### Testes de Performance

✅ **Passou**: Sistema está dentro dos limites de tempo
❌ **Falhou**: Sistema está lento, precisa otimização

Exemplo de saída:
```
✓ deve processar importação de 100 alunos em menos de 5 segundos (2.5s)
✓ deve processar importação de 1000 alunos em menos de 30 segundos (15.2s)
```

### Testes de Benchmark

✅ **Passou**: Uso de recursos está adequado
❌ **Falhou**: Uso excessivo de memória ou CPU

## 🐛 Troubleshooting

### Erro: "Cannot find module"

```bash
# Reinstalar dependências
cd backend
rm -rf node_modules
npm install
```

### Erro: "Database connection"

```bash
# Garantir que banco está rodando
docker-compose up -d db

# Verificar conexão
docker-compose exec db psql -U notas_user -d notas_db
```

### Erro: "Port already in use"

```bash
# Matar processo na porta 3001
lsof -ti:3001 | xargs kill -9

# Ou mudar porta no .env
```

### Testes E2E Frontend falhando

```bash
# Instalar dependências do Playwright
cd frontend
npx playwright install

# Verificar se backend está rodando
curl http://localhost:3001/api
```

## 📝 Exemplo de Execução Completa

```bash
# 1. Preparar ambiente
cd backend
npm install
docker-compose up -d db
npm run prisma:migrate

# 2. Executar todos os testes
npm run test                    # Unitários
npm run test:e2e                # Integração
npm run test -- performance     # Performance
npm run test -- accuracy        # Acurácia
npm run test -- benchmark       # Benchmark

# 3. Ver cobertura
npm run test:cov
open coverage/lcov-report/index.html

# 4. Testes frontend (em outro terminal)
cd ../frontend
npm install
npm run dev                     # Em um terminal
npm run test:e2e                # Em outro terminal
```

## 🎯 Métricas Esperadas

### Acurácia
- ✅ Precisão de cálculos: 100%
- ✅ Arredondamento: 2 casas decimais
- ✅ Classificação: Sempre correta

### Performance
- ✅ 100 alunos: < 5s
- ✅ 1000 alunos: < 30s
- ✅ Cálculo de métricas: < 1s para 100 alunos

### Benchmark
- ✅ Memória: < 50MB para 10k registros
- ✅ CPU: Processamento paralelo eficiente
- ✅ Tempo de resposta: < 500ms para turmas grandes

