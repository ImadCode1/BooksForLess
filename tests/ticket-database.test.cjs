/* global __dirname */
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

function load(relative) {
  const file = path.resolve(__dirname, '..', relative);
  const output = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  const localRequire = (name) => name.startsWith('@/')
    ? load(`src/${name.slice(2)}.ts`) : require(name);
  new Function('require', 'module', 'exports', output)(localRequire, module, module.exports);
  return module.exports;
}
const { saveSharedTicket, fetchSharedTickets, deleteSharedTicket } = load('src/services/ticket-database.ts');
const ticket = {
  id: 'BFL-DEMO-ALGORITHMS',
  book: { isbn: '9780262033848', title: 'Introduction to Algorithms', authors: ['Thomas H. Cormen', 'Charles E. Leiserson', 'Ronald L. Rivest', 'Clifford Stein'], source: 'demo' },
  condition: 'Good', priceCents: 2500, photoUri: 'file:///private/local.jpg',
  createdAt: '2026-11-14T00:00:00Z', status: 'Awaiting drop-off',
};
const row = {
  id: ticket.id, isbn: ticket.book.isbn, title: ticket.book.title,
  authors: ticket.book.authors, condition: ticket.condition, price_cents: ticket.priceCents,
  metadata_source: ticket.book.source, status: ticket.status, created_at: ticket.createdAt,
};

function configureTest(t) {
  const originalUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'public-test-key';
  t.after(() => {
    if (originalUrl === undefined) delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    else process.env.EXPO_PUBLIC_SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    else process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = originalKey;
  });
}

test('shared submission sends metadata but never local photo paths', async (t) => {
  configureTest(t);
  t.mock.method(globalThis, 'fetch', async (_url, init) => {
    const body = JSON.parse(init.body);
    assert.equal(body.price_cents, 2500);
    assert.equal(body.id, ticket.id);
    assert.equal('photoUri' in body, false);
    assert.equal('created_at' in body, false);
    assert.equal('status' in body, false);
    assert.equal(init.headers.apikey, 'public-test-key');
    return { ok: true, json: async () => [row] };
  });
  assert.equal((await saveSharedTicket(ticket)).photoUri, ticket.photoUri);
});

test('retry verifies an existing row instead of inserting a second ticket', async (t) => {
  configureTest(t);
  t.mock.method(globalThis, 'fetch', async (_url, init) => ({
    ok: true, json: async () => init.method === 'POST' ? [] : [row],
  }));
  assert.equal((await saveSharedTicket(ticket)).id, ticket.id);
  assert.equal(globalThis.fetch.mock.callCount(), 2);
});

test('database failures reject rather than returning a successful ticket', async (t) => {
  configureTest(t);
  t.mock.method(globalThis, 'fetch', async () => ({ ok: false, status: 503 }));
  await assert.rejects(saveSharedTicket(ticket), /503/);
});

test('reloaded shared books never contain another device photo path', async (t) => {
  configureTest(t);
  t.mock.method(globalThis, 'fetch', async () => ({ ok: true, json: async () => [row] }));
  const result = await fetchSharedTickets();
  assert.equal(result[0].photoUri, '');
  assert.equal(result[0].priceCents, 2500);
});

test('cancellation calls only the single-ticket RPC and accepts already-deleted retries', async (t) => {
  configureTest(t);
  let result = 1;
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    assert.equal(url, 'https://example.supabase.co/rest/v1/rpc/cancel_demo_book');
    assert.equal(init.method, 'POST');
    assert.deepEqual(JSON.parse(init.body), { ticket_id: ticket.id });
    return { ok: true, json: async () => result };
  });
  await deleteSharedTicket(ticket.id);
  result = 0;
  await deleteSharedTicket(ticket.id);
});

test('invalid ticket IDs never send a cancellation request', async (t) => {
  configureTest(t);
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('Must not fetch'); });
  for (const id of ['', 'BFL-', 'invalid', 'BFL-ABC?delete=all']) {
    await assert.rejects(deleteSharedTicket(id), /valid ticket ID/);
  }
  assert.equal(globalThis.fetch.mock.callCount(), 0);
});

test('failed or unverifiable cancellation is not reported as success', async (t) => {
  configureTest(t);
  let response = { ok: false, status: 403 };
  t.mock.method(globalThis, 'fetch', async () => response);
  await assert.rejects(deleteSharedTicket(ticket.id), /403/);
  for (const result of [null, 2, '1', {}]) {
    response = { ok: true, json: async () => result };
    await assert.rejects(deleteSharedTicket(ticket.id), /could not be verified/);
  }
});

test('live public API saves a seeded demo book, retries safely, and rejects edits/deletes', {
  skip: process.env.BFL_LIVE_TEST !== '1',
}, async () => {
  const saved = await saveSharedTicket(ticket);
  assert.equal(saved.id, ticket.id);
  assert.equal((await saveSharedTicket(ticket)).id, ticket.id);
  assert.ok((await fetchSharedTickets()).some((item) => item.id === ticket.id));
  const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/demo_books?id=eq.${ticket.id}`;
  for (const method of ['PATCH', 'DELETE']) {
    const response = await fetch(url, {
      method, headers: { apikey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json' },
      ...(method === 'PATCH' ? { body: JSON.stringify({ title: 'Must not change' }) } : {}),
    });
    assert.equal(response.ok, false, `${method} must be denied`);
  }
});
