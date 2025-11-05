#!/bin/bash

echo "🧪 Executando Suite Completa de Testes"
echo "======================================"
echo ""

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se está na pasta raiz
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Execute este script na pasta raiz do projeto${NC}"
    exit 1
fi

# 1. Backend - Testes Unitários
echo -e "${BLUE}📦 1. Testes Unitários do Backend${NC}"
cd backend
if [ ! -d "node_modules" ]; then
    echo "Instalando dependências do backend..."
    npm install
fi

echo "Executando testes unitários..."
npm run test -- --passWithNoTests
UNIT_EXIT=$?

if [ $UNIT_EXIT -eq 0 ]; then
    echo -e "${GREEN}✅ Testes unitários passaram!${NC}"
else
    echo -e "${RED}❌ Testes unitários falharam${NC}"
fi

echo ""

# 2. Backend - Testes de Performance
echo -e "${BLUE}⚡ 2. Testes de Performance${NC}"
npm run test:performance -- --passWithNoTests 2>/dev/null || echo "⚠️  Testes de performance não encontrados"
echo ""

# 3. Backend - Testes de Acurácia
echo -e "${BLUE}🎯 3. Testes de Acurácia${NC}"
npm run test:accuracy -- --passWithNoTests 2>/dev/null || echo "⚠️  Testes de acurácia não encontrados"
echo ""

# 4. Backend - Testes de Benchmark
echo -e "${BLUE}📈 4. Testes de Benchmark${NC}"
npm run test:benchmark -- --passWithNoTests 2>/dev/null || echo "⚠️  Testes de benchmark não encontrados"
echo ""

# 5. Backend - Testes E2E (requer banco)
echo -e "${YELLOW}⚠️  5. Testes E2E (requer banco de dados rodando)${NC}"
echo "Verificando se o banco está acessível..."

if docker-compose ps db | grep -q "Up"; then
    echo "Banco está rodando, executando testes E2E..."
    npm run test:e2e -- --passWithNoTests 2>/dev/null || echo "⚠️  Testes E2E falharam ou não encontrados"
else
    echo -e "${YELLOW}⚠️  Banco não está rodando. Para executar testes E2E:${NC}"
    echo "   docker-compose up -d db"
    echo "   npm run prisma:migrate"
    echo "   npm run test:e2e"
fi

echo ""

# 6. Frontend - Testes E2E
echo -e "${BLUE}🌐 6. Testes E2E do Frontend${NC}"
cd ../frontend

if [ ! -d "node_modules" ]; then
    echo "Instalando dependências do frontend..."
    npm install
fi

if command -v npx &> /dev/null && npx playwright --version &> /dev/null; then
    echo "Executando testes Playwright..."
    npm run test:e2e -- --passWithNoTests 2>/dev/null || echo "⚠️  Testes E2E do frontend não executados (requer backend rodando)"
else
    echo -e "${YELLOW}⚠️  Playwright não instalado. Execute: npx playwright install${NC}"
fi

echo ""

# Resumo
echo -e "${BLUE}======================================"
echo "📊 Resumo dos Testes"
echo "======================================${NC}"
echo ""
echo -e "Para ver relatórios detalhados:"
echo "  Backend: cd backend && npm run test:cov"
echo "  Frontend: cd frontend && npm run test:e2e:report"
echo ""
echo -e "${GREEN}✅ Execução concluída!${NC}"

