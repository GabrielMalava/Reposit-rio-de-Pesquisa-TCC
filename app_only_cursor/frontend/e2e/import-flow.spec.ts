import { test, expect } from '@playwright/test';

test.describe('Fluxo de Importação E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Fazer login antes de cada teste
    await page.goto('http://localhost:3000/login');
    
    // Criar usuário se não existir ou fazer login
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await emailInput.fill('admin@example.com');
    await passwordInput.fill('admin123');
    await submitButton.click();

    // Aguardar redirecionamento
    await page.waitForURL('**/dashboard', { timeout: 5000 });
  });

  test('deve completar fluxo completo de importação', async ({ page }) => {
    // 1. Navegar para página de importação
    await page.goto('http://localhost:3000/import');
    await expect(page.locator('h1')).toContainText('Importar Dados XML');

    // 2. Verificar que área de upload está presente
    const uploadArea = page.locator('input[type="file"]');
    await expect(uploadArea).toBeVisible();

    // 3. Criar arquivo XML de teste
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Importacao>
  <Cursos>
    <Curso>
      <Codigo>TEST101</Codigo>
      <Nome>Teste Disciplina</Nome>
      <CargaHoraria>60</CargaHoraria>
    </Curso>
  </Cursos>
  <Turmas>
    <Turma>
      <Id>TURTEST001</Id>
      <CursoCodigo>TEST101</CursoCodigo>
      <Semestre>2024-1</Semestre>
    </Turma>
  </Turmas>
  <Alunos>
    <Aluno>
      <RA>TEST001</RA>
      <Nome>Aluno Teste</Nome>
    </Aluno>
  </Alunos>
  <Notas>
    <Nota>
      <RA>TEST001</RA>
      <TurmaId>TURTEST001</TurmaId>
      <Valor>8.5</Valor>
    </Nota>
  </Notas>
</Importacao>`;

    // 4. Fazer upload do arquivo
    await uploadArea.setInputFiles({
      name: 'test.xml',
      mimeType: 'application/xml',
      buffer: Buffer.from(xmlContent),
    });

    // 5. Clicar no botão de importar
    const importButton = page.locator('button:has-text("Importar Arquivo")');
    await importButton.click();

    // 6. Aguardar mensagem de sucesso
    await expect(page.locator('text=Importação realizada com sucesso')).toBeVisible({
      timeout: 10000,
    });
  });

  test('deve rejeitar arquivo não-XML', async ({ page }) => {
    await page.goto('http://localhost:3000/import');

    const uploadArea = page.locator('input[type="file"]');
    
    // Tentar fazer upload de arquivo de texto
    await uploadArea.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not xml content'),
    });

    // Verificar mensagem de erro
    await expect(page.locator('text=Apenas arquivos XML são permitidos')).toBeVisible();
  });

  test('deve exibir barra de progresso durante upload', async ({ page }) => {
    await page.goto('http://localhost:3000/import');

    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Importacao>
  <Cursos>
    <Curso>
      <Codigo>TEST101</Codigo>
      <Nome>Teste</Nome>
      <CargaHoraria>60</CargaHoraria>
    </Curso>
  </Cursos>
  <Turmas>
    <Turma>
      <Id>TUR001</Id>
      <CursoCodigo>TEST101</CursoCodigo>
      <Semestre>2024-1</Semestre>
    </Turma>
  </Turmas>
  <Alunos>
    <Aluno>
      <RA>TEST001</RA>
      <Nome>Teste</Nome>
    </Aluno>
  </Alunos>
  <Notas>
    <Nota>
      <RA>TEST001</RA>
      <TurmaId>TUR001</TurmaId>
      <Valor>7.0</Valor>
    </Nota>
  </Notas>
</Importacao>`;

    const uploadArea = page.locator('input[type="file"]');
    await uploadArea.setInputFiles({
      name: 'test.xml',
      mimeType: 'application/xml',
      buffer: Buffer.from(xmlContent),
    });

    const importButton = page.locator('button:has-text("Importar Arquivo")');
    await importButton.click();

    // Verificar que barra de progresso aparece
    const progressBar = page.locator('.bg-primary-600');
    await expect(progressBar).toBeVisible({ timeout: 1000 });
  });
});

test.describe('Dashboard E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.locator('input[name="email"]').fill('admin@example.com');
    await page.locator('input[name="password"]').fill('admin123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard');
  });

  test('deve exibir KPIs no dashboard', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');

    // Verificar se os cards de KPI estão presentes
    await expect(page.locator('text=Total de Alunos')).toBeVisible();
    await expect(page.locator('text=Média Geral')).toBeVisible();
    await expect(page.locator('text=Taxa de Aprovação')).toBeVisible();
    await expect(page.locator('text=Total de Disciplinas')).toBeVisible();
  });

  test('deve exibir gráficos no dashboard', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');

    // Verificar se os gráficos estão presentes (canvas do Chart.js)
    const charts = page.locator('canvas');
    await expect(charts.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Relatórios E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.locator('input[name="email"]').fill('admin@example.com');
    await page.locator('input[name="password"]').fill('admin123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard');
  });

  test('deve filtrar alunos por busca', async ({ page }) => {
    await page.goto('http://localhost:3000/reports');

    const searchInput = page.locator('input[placeholder*="Nome ou RA"]');
    await searchInput.fill('TEST');

    // Aguardar resultados filtrados
    await page.waitForTimeout(1000);

    // Verificar que apenas alunos com "TEST" aparecem (ou nenhum)
    const tableRows = page.locator('tbody tr');
    const count = await tableRows.count();

    // Se houver resultados, verificar que contêm "TEST"
    if (count > 0) {
      const firstRow = tableRows.first();
      const text = await firstRow.textContent();
      expect(text?.toUpperCase()).toContain('TEST');
    }
  });

  test('deve exportar dados em diferentes formatos', async ({ page }) => {
    await page.goto('http://localhost:3000/reports');

    // Testar exportação XML
    const xmlButton = page.locator('button:has-text("Exportar XML")');
    await xmlButton.click();

    // Aguardar download (em ambiente real, verificar se arquivo foi baixado)
    await page.waitForTimeout(2000);

    // Verificar mensagem de sucesso
    await expect(page.locator('text=Exportação XML realizada com sucesso')).toBeVisible({
      timeout: 5000,
    });
  });
});

