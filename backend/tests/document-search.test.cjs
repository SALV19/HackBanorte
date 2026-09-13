const assert = require('node:assert/strict');
const { test, afterEach } = require('node:test');
const { Types } = require('mongoose');
const { DocumentModel } = require('../model/documents.model.ts');
const { vectorSearch } = require('../usecase/tools.uscase.ts');
const { inputMessage } = require('../types/inputMessage.types.ts');

const originalIndex = process.env.DOCUMENTS_VECTOR_INDEX;
const originalPath = process.env.DOCUMENTS_VECTOR_PATH;
const userId = new Types.ObjectId().toHexString();
const documents = [{ title: 'Mi ahorro', content: 'Saldo ahorrado: 5000', category: 'Finanzas', score: 0.9 }];

afterEach(() => {
  for (const [key, value] of Object.entries({
    DOCUMENTS_VECTOR_INDEX: originalIndex,
    DOCUMENTS_VECTOR_PATH: originalPath,
  })) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test('envía texto a Atlas y restringe la búsqueda al usuario antes del límite', async (t) => {
  process.env.DOCUMENTS_VECTOR_INDEX = 'documents_auto';
  delete process.env.DOCUMENTS_VECTOR_PATH;
  const aggregate = t.mock.method(DocumentModel.collection, 'aggregate', (pipeline) => {
    const stage = pipeline[0].$vectorSearch;
    assert.equal(stage.query, '¿Cuánto tengo ahorrado?');
    assert.equal(stage.index, 'documents_auto');
    assert.equal(stage.path, 'content');
    assert.equal(stage.filter.id_user.toHexString(), userId);
    assert.equal(stage.limit, 5);
    assert.ok(stage.numCandidates >= stage.limit);
    assert.equal(stage.queryVector, undefined);
    assert.equal(stage.model, undefined);
    assert.equal(pipeline[1].$project.content, 1);
    return { toArray: async () => documents };
  });
  assert.deepEqual(await vectorSearch('  ¿Cuánto tengo ahorrado?  ', userId), documents);
  assert.equal(aggregate.mock.callCount(), 1);
});

test('respeta el campo autoEmbed configurado y permite resultados vacíos', async (t) => {
  process.env.DOCUMENTS_VECTOR_INDEX = 'documents_auto';
  process.env.DOCUMENTS_VECTOR_PATH = 'search_text';
  t.mock.method(DocumentModel.collection, 'aggregate', (pipeline) => {
    assert.equal(pipeline[0].$vectorSearch.path, 'search_text');
    return { toArray: async () => [] };
  });
  assert.deepEqual(await vectorSearch('ahorro', userId), []);
});

test('rechaza consultas vacías, usuarios inválidos e índice ausente sin consultar Mongo', async (t) => {
  const aggregate = t.mock.method(DocumentModel.collection, 'aggregate', () => assert.fail('No debe consultar Mongo'));
  await assert.rejects(vectorSearch('  ', userId), { code: 'EMPTY_QUERY' });
  await assert.rejects(vectorSearch('ahorro', 'incorrecto'), { code: 'INVALID_USER_ID' });
  delete process.env.DOCUMENTS_VECTOR_INDEX;
  await assert.rejects(vectorSearch('ahorro', userId), { code: 'VECTOR_SEARCH_NOT_CONFIGURED' });
  assert.equal(aggregate.mock.callCount(), 0);
  assert.equal(inputMessage.safeParse({ userName: 'Ana', content: '  ' }).success, false);
});

test('propaga errores de Atlas para no confundirlos con cero resultados', async (t) => {
  process.env.DOCUMENTS_VECTOR_INDEX = 'documents_auto';
  const failure = new Error('Index is not ready');
  t.mock.method(DocumentModel.collection, 'aggregate', () => ({ toArray: async () => { throw failure; } }));
  await assert.rejects(vectorSearch('ahorro', userId), (error) => error === failure);
});

test('el mensaje consulta documents y entrega los resultados a ambas fases de Gemini', async (t) => {
  // Sustituye únicamente los servicios externos; ejecuta los usecases y llm reales.
  const sdkPath = require.resolve('@google/genai');
  require(sdkPath);
  const sdkExports = require.cache[sdkPath].exports;
  const originalKey = process.env.GEMINI_API_KEY;
  const calls = [];
  const response = { componentes: [{ id: 'saldo', tipo: 'texto', contenido: 'Tu documento registra 5000.' }] };
  require.cache[sdkPath].exports = {
    GoogleGenAI: class {
      models = { generateContent: async (request) => {
        calls.push(request);
        return { text: JSON.stringify(response) };
      } };
    },
    mcpToTool: () => ({}),
  };
  process.env.GEMINI_API_KEY = 'test-key-no-network';
  process.env.DOCUMENTS_VECTOR_INDEX = 'documents_auto';
  t.after(() => {
    require.cache[sdkPath].exports = sdkExports;
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
  });

  // Se carga antes de llm para reemplazar su cliente MCP sin abrir un proceso.
  const mcpPath = require.resolve('../services/mcpClient.ts');
  require(mcpPath);
  const mcpExports = require.cache[mcpPath].exports;
  require.cache[mcpPath].exports = { getMcpClient: () => ({}) };
  t.after(() => { require.cache[mcpPath].exports = mcpExports; });

  const { UserDataAccess } = require('../model/user.model.ts');
  const { TransactionsDataAccess } = require('../model/transactions.model.ts');
  const { Conversacion } = require('../model/Conversacion.ts');
  const profile = { name: 'Ana', age: 50, job: 'Docente' };
  t.mock.method(UserDataAccess, 'getUserByName', async () => ({ _id: new Types.ObjectId(userId), toObject: () => profile }));
  t.mock.method(TransactionsDataAccess, 'getGroupedTransactions', async () => ({ income: 10000, expenses: 5000 }));
  let searched = false;
  t.mock.method(DocumentModel.collection, 'aggregate', (pipeline) => {
    assert.equal(pipeline[0].$vectorSearch.query, '¿Cuánto tengo ahorrado?');
    assert.equal(pipeline[0].$vectorSearch.filter.id_user.toHexString(), userId);
    searched = true;
    return { toArray: async () => documents };
  });
  const conversation = { id: new Types.ObjectId().toHexString(), contents: [], markModified: () => {}, save: async () => {} };
  t.mock.method(Conversacion, 'create', async () => conversation);
  const processMessage = require('../usecase/poccessMessage.usecase.ts').default;
  const result = await processMessage({ userName: 'Ana', content: '¿Cuánto tengo ahorrado?' });
  assert.ok(searched);
  assert.equal(calls.length, 2);
  for (const call of calls) {
    const parts = call.contents.at(-1).parts;
    assert.equal(parts[0].text, '¿Cuánto tengo ahorrado?');
    assert.ok(parts[1].text.includes(JSON.stringify(documents)));
  }
  assert.deepEqual(result, { conversationId: conversation.id, componentes: response });
  assert.ok(conversation.contents[0].parts[1].text.includes('Mi ahorro'));
});
