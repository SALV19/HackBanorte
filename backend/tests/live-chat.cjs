// Prueba optativa con servidores iniciados: node --env-file=.env tests/live-chat.cjs
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

(async () => {
  let conversationId;
  let userId;
  try {
    const base = process.env.TEST_CHAT_BASE_URL || 'http://localhost:5173';
    await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGO_DB_NAME, serverSelectionTimeoutMS: 10000 });
    const db = mongoose.connection.db;
    const profilesResponse = await fetch(`${base}/mcp/profiles`);
    assert.equal(profilesResponse.status, 200);
    const { profiles } = await profilesResponse.json();
    let selected;
    for (const profile of profiles) {
      const id = new mongoose.Types.ObjectId(profile.id);
      if (await db.collection('documents').countDocuments({ id_user: id })) { selected = profile; userId = id; break; }
    }
    assert.ok(selected, 'Debe existir un perfil con documentos');
    const response = await fetch(`${base}/mcp/chat`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName: selected.name, content: 'Muéstrame mis gastos de agosto de 2026 en una tabla y una gráfica' }),
      signal: AbortSignal.timeout(100000),
    });
    const payload = await response.json();
    assert.equal(response.status, 200, payload.message);
    const report = payload.message;
    conversationId = report.conversationId;
    assert.equal(report.intent, 'gastos');
    assert.deepEqual(report.period, { from: '2026-08-01', to: '2026-08-31' });
    const data = report.a2ui.find(message => message.updateDataModel).updateDataModel.value;
    const transactions = await db.collection('transactions').find({ id_user: userId, createdAt: { $gte: new Date('2026-08-01'), $lt: new Date('2026-09-01') } }).toArray();
    const sum = values => Math.round(values.reduce((total, value) => total + value, 0) * 100) / 100;
    assert.equal(data.totals.income, sum(transactions.filter(t => t.amount > 0).map(t => t.amount)));
    assert.equal(data.totals.expenses, sum(transactions.filter(t => t.amount < 0).map(t => -t.amount)));
    assert.equal(data.totals.count, transactions.length);
    assert.ok(report.documentCount > 0, 'Vector Search debe devolver documentos');
    for (const document of data.documents) assert.ok(await db.collection('documents').findOne({ _id: new mongoose.Types.ObjectId(document.id), id_user: userId }), 'La fuente debe pertenecer al perfil');
    const components = report.a2ui.find(message => message.updateComponents).updateComponents.components;
    assert.ok(components.some(component => component.component === 'Chart'));
    assert.ok(components.some(component => component.component === 'Table'));
    console.log(JSON.stringify({ route: `${base}/mcp/chat`, result: 'PASS', transactions: transactions.length, documents: report.documentCount, totalsVerified: true, sourcesBelongToProfile: true, basicMode: report.warnings.some(warning => warning.includes('reglas básicas')) }));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    // Elimina únicamente la conversación nueva creada por esta ejecución.
    if (conversationId && userId && mongoose.connection.db) await mongoose.connection.db.collection('reportconversations').deleteOne({ _id: new mongoose.Types.ObjectId(conversationId), id_user: userId });
    await mongoose.disconnect();
  }
})();
