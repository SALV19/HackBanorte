import { test, expect } from '@playwright/test';

function report() {
  return { success: true, message: {
    conversationId: 'aaaaaaaaaaaaaaaaaaaaaaaa', intent: 'gastos', title: 'Tus gastos de agosto', summary: 'Consulta los movimientos y documentos relacionados.',
    period: { from: '2026-08-01', to: '2026-08-31' }, warnings: [], documentCount: 1,
    a2ui: [
      { version: 'v0.9', createSurface: { surfaceId: 'report-test', catalogId: 'urn:hackbanorte:a2ui:report:v1' } },
      { version: 'v0.9', updateDataModel: { surfaceId: 'report-test', path: '/', value: { totals: { expenses: 1200 }, categories: [{ label: 'Food', value: 1200 }], documents: [{ id: 'doc1', title: 'Plan de ahorro', content: 'Ahorro documentado del perfil.', score: .8 }] } } },
      { version: 'v0.9', updateComponents: { surfaceId: 'report-test', components: [
        { id: 'root', component: 'Column', children: ['expenses', 'chart', 'table', 'documents', 'form', 'suggestions'] },
        { id: 'expenses', component: 'Metric', label: 'Gastos del periodo', value: { path: '/totals/expenses' }, format: 'currency' },
        { id: 'chart', component: 'Chart', title: 'Gastos por categoría', kind: 'bar', data: { path: '/categories' }, series: [{ key: 'value', label: 'Importe' }] },
        { id: 'table', component: 'Table', title: 'Detalle de gastos', rows: { path: '/categories' }, columns: [{ key: 'label', label: 'Categoría' }, { key: 'value', label: 'Importe', format: 'currency' }] },
        { id: 'documents', component: 'Sources', title: 'Documentos relacionados', items: { path: '/documents' } },
        { id: 'form', component: 'ReportForm', title: 'Construye tu escenario de retiro' },
        { id: 'suggestions', component: 'Suggestions', items: ['¿Y el mes anterior?'] },
      ] } },
    ],
  } };
}

test.beforeEach(async ({ page }) => {
  await page.route('**/mcp/profiles', route => route.fulfill({ json: { success: true, profiles: [{ id: '1', name: 'Ana', age: 40, job: 'Docente' }, { id: '2', name: 'Luis', age: 35, job: 'Diseñador' }] } }));
});

test('envía al backend y renderiza tarjetas, tablas, gráficas y fuentes', async ({ page }) => {
  let payload: Record<string, unknown> = {};
  await page.route('**/mcp/chat', route => { payload = route.request().postDataJSON(); return route.fulfill({ json: report() }); });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Hola, Ana/ })).toBeVisible();
  await page.getByLabel('Tu pregunta financiera').fill('Mis gastos de agosto en una tabla y una gráfica');
  await page.getByRole('button', { name: 'Enviar mensaje' }).click();
  await expect(page.getByRole('heading', { name: 'Tus gastos de agosto' })).toBeVisible();
  expect(payload.userName).toBe('Ana');
  expect(payload.content).toBe('Mis gastos de agosto en una tabla y una gráfica');
  await expect(page.locator('.metric-card strong')).toContainText('1,200');
  await expect(page.locator('.table-card')).toContainText('Alimentación');
  await expect(page.locator('.bar-track > span')).toHaveCSS('width', /[1-9]/);
  await page.getByText('Plan de ahorro', { exact: true }).click();
  await expect(page.getByText('Ahorro documentado del perfil.')).toBeVisible();
  await page.screenshot({ path: 'test-results/report-desktop.png', fullPage: true });
});

test('conserva conversación en seguimientos y la limpia al cambiar de perfil', async ({ page }) => {
  const payloads: Record<string, unknown>[] = [];
  await page.route('**/mcp/chat', route => { payloads.push(route.request().postDataJSON()); return route.fulfill({ json: report() }); });
  await page.goto('/');
  await page.getByRole('button', { name: /Entiende tus gastos/ }).click();
  await page.getByRole('button', { name: /¿Y el mes anterior/ }).click();
  await expect(page.locator('.assistant-message')).toHaveCount(2);
  expect(payloads[1].conversationId).toBe('aaaaaaaaaaaaaaaaaaaaaaaa');
  await page.getByLabel('Perfil de consulta').selectOption('Luis');
  await expect(page.locator('.assistant-message')).toHaveCount(0);
  await page.getByRole('button', { name: /Entiende tus gastos/ }).click();
  await expect(page.locator('.assistant-message')).toHaveCount(1);
  expect(payloads[2].userName).toBe('Luis');
  expect(payloads[2].conversationId).toBeUndefined();
});

test('el formulario envía parámetros numéricos explícitos', async ({ page }) => {
  const payloads: Record<string, unknown>[] = [];
  await page.route('**/mcp/chat', route => { payloads.push(route.request().postDataJSON()); return route.fulfill({ json: report() }); });
  await page.goto('/');
  await page.getByRole('button', { name: /Planea tu retiro/ }).click();
  await page.getByLabel('Ahorro actual (MXN)').fill('1000');
  await page.getByLabel('Aportación mensual (MXN)').fill('100');
  await page.getByLabel('Tasa anual del escenario (%)').fill('0');
  await page.getByLabel('Años de ahorro').fill('2');
  await page.getByRole('button', { name: 'Calcular escenario' }).click();
  await expect(page.locator('.assistant-message')).toHaveCount(2);
  expect(payloads[1].simulation).toEqual({ initialSavings: 1000, monthlyContribution: 100, annualRate: 0, years: 2 });
});

test('muestra errores y permite reintentar sin duplicar el mensaje', async ({ page }) => {
  let calls = 0;
  await page.route('**/mcp/chat', route => ++calls === 1 ? route.fulfill({ status: 503, json: { success: false, message: 'La base no está disponible' } }) : route.fulfill({ json: report() }));
  await page.goto('/');
  await page.getByRole('button', { name: /Entiende tus gastos/ }).click();
  await expect(page.getByRole('alert')).toContainText('La base no está disponible');
  await page.getByRole('button', { name: 'Reintentar consulta' }).click();
  await expect(page.locator('.assistant-message')).toHaveCount(1);
  await expect(page.locator('.user-message')).toHaveCount(1);
});

test('la vista móvil no desborda y el reporte sigue siendo legible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/mcp/chat', route => route.fulfill({ json: report() }));
  await page.goto('/');
  await page.getByRole('button', { name: /Entiende tus gastos/ }).click();
  await expect(page.getByRole('heading', { name: 'Tus gastos de agosto' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/report-mobile.png', fullPage: true });
});
