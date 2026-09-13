const assert = require('node:assert/strict');
const { test, before, after } = require('node:test');
const { Types } = require('mongoose');
const app = require('../dist/app').default;
const { UserDataAccess } = require('../dist/model/user.model');
const { ReportConversation } = require('../dist/model/conversation.model');
const llm = require('../dist/services/llm');
const db = require('../dist/mcp/db.tool');
const search = require('../dist/usecase/tools.uscase');
let server;
let base;
before(async () => {
  server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise(resolve => server.close(resolve)));
const user = { _id: new Types.ObjectId(), name: 'Ana', age: 40, job: 'Docente' };
const plan = { intent: 'gastos', query: 'gastos de comida', from: '2026-08-01', to: '2026-08-31', category: null, sections: ['metrics', 'categories', 'transactions', 'documents'] };
const finance = { totals: { income: 5000, expenses: 1200, balance: 3800, savingsRate: 76, count: 2 }, categories: [{ label: 'Food', value: 1200 }], monthly: [], transactions: [] };
function setup(t) {
  t.mock.method(UserDataAccess, 'getUserByName', async () => user);
  t.mock.method(ReportConversation.prototype, 'save', async function () { return this; });
  t.mock.method(llm, 'identifyIntent', async () => structuredClone(plan));
  t.mock.method(llm, 'explainReport', async () => ({ title: 'Tus gastos', summary: 'Detalle de tus movimientos.', sections: ['categories'], followUps: [] }));
  t.mock.method(db, 'getFinanceReport', async (id, selectedPlan, period) => {
    assert.equal(id, user._id.toString());
    assert.ok(selectedPlan.intent);
    assert.ok(period.from <= period.to);
    return finance;
  });
  t.mock.method(search, 'vectorSearch', async (_query, id) => {
    assert.equal(id, user._id.toString());
    return [{ id: 'doc1', title: 'Mi ahorro', content: 'Información de referencia', category: 'Finanzas', score: 0.8 }];
  });
}
async function post(body) {
  const response = await fetch(`${base}/mcp/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { status: response.status, body: await response.json() };
}
test('POST /mcp/chat conecta intención, datos, documentos y A2UI', async t => {
  setup(t);
  const response = await post({ userName: 'Ana', content: 'Mis gastos de agosto' });
  assert.equal(response.status, 200);
  assert.equal(response.body.message.intent, 'gastos');
  assert.equal(response.body.message.documentCount, 1);
  assert.equal(response.body.message.a2ui[1].updateDataModel.value.totals.expenses, 1200);
  assert.equal(response.body.message.a2ui[1].updateDataModel.value.documents[0].id, 'doc1');
  assert.match(response.body.message.conversationId, /^[a-f\d]{24}$/);
});
test('los mensajes vacíos se rechazan antes de consultar datos', async () => {
  assert.equal((await post({ userName: 'Ana', content: '  ' })).status, 400);
});
test('no permite reutilizar una conversación de otro perfil', async t => {
  setup(t);
  t.mock.method(ReportConversation, 'findOne', async filter => { assert.equal(String(filter.id_user), String(user._id)); return null; });
  const result = await post({ userName: 'Ana', content: 'Continuar', conversationId: new Types.ObjectId().toString() });
  assert.equal(result.status, 404);
  assert.equal(result.body.error, 'CONVERSATION_NOT_FOUND');
});
test('fallas documentales se muestran y no se presentan como fuentes válidas', async t => {
  setup(t);
  t.mock.method(search, 'vectorSearch', async () => { throw new Error('Index unavailable'); });
  const response = await post({ userName: 'Ana', content: 'Mis gastos' });
  assert.equal(response.status, 200);
  assert.equal(response.body.message.documentCount, 0);
  assert.ok(response.body.message.warnings.some(w => w.includes('no está disponible')));
});
test('la falta de cuota usa un modo básico explícito con datos reales', async t => {
  setup(t);
  t.mock.method(llm, 'identifyIntent', async () => { throw new Error('Quota exceeded'); });
  const response = await post({ userName: 'Ana', content: 'Gastos de agosto de 2026' });
  assert.equal(response.status, 200);
  assert.equal(response.body.message.period.from, '2026-08-01');
  assert.ok(response.body.message.warnings.some(w => w.includes('reglas básicas')));
  assert.equal(response.body.message.a2ui[1].updateDataModel.value.totals.expenses, 1200);
});
