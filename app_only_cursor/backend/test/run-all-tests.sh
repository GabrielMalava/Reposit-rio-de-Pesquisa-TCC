#!/bin/bash

echo "🚀 Executando todos os testes do sistema..."

echo ""
echo "📊 Testes Unitários - Cálculos de Métricas"
npm run test -- metrics-calculation.service.spec.ts --coverage

echo ""
echo "✅ Testes de Validação XML"
npm run test -- xml-validation.service.spec.ts --coverage

echo ""
echo "🔗 Testes de Integração E2E"
npm run test:e2e

echo ""
echo "⚡ Testes de Performance"
npm run test -- performance/import-performance.spec.ts

echo ""
echo "🎯 Testes de Acurácia"
npm run test -- accuracy/calculations-accuracy.spec.ts

echo ""
echo "📈 Testes de Benchmark"
npm run test -- benchmark/benchmark.spec.ts

echo ""
echo "✅ Todos os testes concluídos!"

