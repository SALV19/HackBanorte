const assert = require('node:assert/strict');
const { test } = require('node:test');
const { Types } = require('mongoose');
const { basicIntent } = require('../dist/services/basicIntent');
const { simulateRetirement } = require('../dist/services/retirement');
const { resolvePeriod } = require('../dist/mcp/db.tool');
const { buildReportUI } = require('../dist/views/report.builder');
const { inputMessage } = require('../dist/types/inputMessage.types');

test('valida entradas vacías, identificadores y parámetros de simulación', () => {
  assert.equal(inputMessage.safeParse({ userName: 'Ana', content: '  ' }).success, false);
  assert.equal(inputMessage.safeParse({ userName: 'Ana', content: 'retiro', conversationId: 'invalido' }).success, false);
  assert.equal(inputMessage.safeParse({ userName: 'Ana', content: 'retiro', simulation: { initialSavings: 0, monthlyContribution: 100, annualRate: -1, years: 5 } }).success, false);
});

test('interpreta meses, categorías y seguimiento en modo básico', () => {
  const now = new Date('2026-09-13T12:00:00Z');
  const plan = basicIntent('Mis gastos de comida de agosto de 2026 en una tabla', undefined, now);
  assert.equal(plan.intent, 'gastos');
  assert.equal(plan.category, 'Food');
  assert.deepEqual(resolvePeriod(plan, now), { from: '2026-08-01', to: '2026-08-31' });
  assert.ok(plan.sections.includes('transactions'));
  const followUp = basicIntent('¿Y el mes anterior?', { intent: 'gastos', category: 'Food', query: plan.query, period: resolvePeriod(plan, now) }, now);
  assert.deepEqual(resolvePeriod(followUp, now), { from: '2026-07-01', to: '2026-07-31' });
  assert.equal(followUp.intent, 'gastos');
  assert.equal(followUp.category, 'Food');
  assert.ok(followUp.query.includes('comida'));
  assert.deepEqual(resolvePeriod(basicIntent('Últimos seis meses', undefined, now), now), { from: '2026-04-01', to: '2026-09-13' });
});

test('rechaza fechas inexistentes y periodos invertidos', () => {
  assert.throws(() => resolvePeriod({ from: '2026-02-30', to: '2026-03-01' }), { code: 'INVALID_PERIOD' });
  assert.throws(() => resolvePeriod({ from: '2026-09-02', to: '2026-09-01' }), { code: 'INVALID_PERIOD' });
});

test('calcula la proyección sin inventar rendimientos y maneja tasa cero', () => {
  const projection = simulateRetirement({ initialSavings: 1000, monthlyContribution: 100, annualRate: 0, years: 2 });
  assert.equal(projection.finalBalance, 3400);
  assert.equal(projection.points.length, 3);
  const interest = simulateRetirement({ initialSavings: 1000, monthlyContribution: 0, annualRate: 12, years: 1 });
  assert.equal(interest.finalBalance, Math.round(1000 * 1.01 ** 12 * 100) / 100);
});

test('genera un árbol A2UI con datos separados de los componentes', () => {
  const plan = basicIntent('Gastos en tabla y gráfica');
  const finance = { totals: { income: 2500, expenses: 1250, balance: 1250, savingsRate: 50, count: 2 }, monthly: [], categories: [{ label: 'Food', value: 1250 }], transactions: [{ date: '2026-09-01', category: 'Food', reason: 'Supermercado', amount: -1250 }] };
  const messages = buildReportUI(plan, { title: 'Gastos', summary: 'Resumen', sections: ['metrics'], followUps: [] }, finance, []);
  assert.equal(messages[0].version, 'v0.9');
  assert.equal(messages[0].createSurface.catalogId, 'urn:hackbanorte:a2ui:report:v1');
  const data = messages[1].updateDataModel.value;
  assert.equal(data.totals.expenses, 1250);
  const components = messages[2].updateComponents.components;
  const ids = new Set(components.map(c => c.id));
  assert.equal(ids.size, components.length);
  assert.ok(components.find(c => c.id === 'root').children.every(id => ids.has(id)));
  assert.ok(components.some(c => c.component === 'Chart'));
  assert.ok(components.some(c => c.component === 'Table'));
  assert.deepEqual(components.find(c => c.id === 'expenses').value, { path: '/totals/expenses' });
});

test('la búsqueda usa texto, ObjectId y el filtro dentro de vectorSearch', async t => {
  const mongoose = require('mongoose');
  const original = mongoose.connection.db;
  const userId = new Types.ObjectId();
  mongoose.connection.db = { collection: name => {
    assert.equal(name, 'documents');
    return { aggregate: pipeline => {
      const search = pipeline[0].$vectorSearch;
      assert.equal(search.query, 'mi retiro');
      assert.equal(search.filter.id_user.toString(), userId.toString());
      assert.equal(search.queryVector, undefined);
      return { toArray: async () => [] };
    } };
  } };
  t.after(() => { mongoose.connection.db = original; });
  const { vectorSearch } = require('../dist/usecase/tools.uscase');
  assert.deepEqual(await vectorSearch('mi retiro', userId.toString()), []);
});
