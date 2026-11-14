/* global __dirname */
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

// Load the pure TypeScript services with the existing compiler, not a new test dependency.
const cache = new Map();
function load(relative) {
  const filename = path.resolve(__dirname, '..', relative);
  if (cache.has(filename)) return cache.get(filename);
  const output = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  cache.set(filename, module.exports);
  const localRequire = (name) => name.startsWith('@/')
    ? load(`src/${name.slice(2)}.ts`)
    : require(name);
  new Function('require', 'module', 'exports', output)(localRequire, module, module.exports);
  return module.exports;
}

const { isValidIsbn13, normalizeIsbn } = load('src/utils/isbn.ts');
const { DEMO_BOOKS, DEMO_ISBN } = load('src/data/demo-books.ts');
const { lookupBook } = load('src/services/books.ts');
const { prepareSellingBook, getPendingSellingBook } = load('src/services/selling-handoff.ts');
const { parseCadPrice, formatCad, createLocalTicket, ticketQrValue } = load('src/utils/tickets.ts');
const { addOrder } = load('src/services/orders.ts');
const { pickupQrValue } = load('src/utils/pickup.ts');
const { getBookFeedback, setBookCompleted, rateBookExperience } = load('src/services/book-feedback.ts');

test('ISBN-13 validates checksum, prefix, length, and permitted formatting', () => {
  assert.equal(normalizeIsbn('978-0 262033848'), DEMO_ISBN);
  for (const book of DEMO_BOOKS) assert.equal(isValidIsbn13(book.isbn), true);
  assert.equal(isValidIsbn13('9791090636071'), true);
  for (const value of ['9780262033849', '1234567890128', '0262033844', '', '9780262033848x']) {
    assert.equal(isValidIsbn13(value), false, value);
  }
});

test('demo ISBNs resolve without making network requests', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('offline'); });
  const result = await lookupBook(DEMO_ISBN);
  assert.equal(result.status, 'found');
  assert.equal(result.book.source, 'demo');
  assert.equal(globalThis.fetch.mock.callCount(), 0);
});

const apiIsbn = '9780980200447';
test('Open Library request extracts metadata and upgrades cover URL to HTTPS', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url) => {
    assert.match(url, /bibkeys=ISBN%3A9780980200447&format=json&jscmd=data/);
    return { ok: true, json: async () => ({
      [`ISBN:${apiIsbn}`]: {
        title: 'Slow reading', authors: [{ name: 'John Miedema' }, null],
        cover: { large: 'http://covers.openlibrary.org/b/id/5546156-L.jpg' },
      },
    }) };
  });
  const result = await lookupBook(apiIsbn);
  assert.equal(result.status, 'found');
  assert.deepEqual(result.book.authors, ['John Miedema']);
  assert.equal(result.book.isbn, apiIsbn);
  assert.match(result.book.coverUrl, /^https:/);
});

test('missing results allow manual entry', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => ({ ok: true, json: async () => ({}) }));
  assert.equal((await lookupBook(apiIsbn)).status, 'not-found');
});

test('missing optional authors and cover do not prevent confirmation', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => ({
    ok: true, json: async () => ({ [`ISBN:${apiIsbn}`]: { title: 'Book' } }),
  }));
  const result = await lookupBook(apiIsbn);
  assert.equal(result.status, 'found');
  assert.deepEqual(result.book.authors, []);
  assert.equal(result.book.coverUrl, undefined);
});

test('network, HTTP, and malformed JSON errors return a recoverable failure', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch');
  for (const response of [
    async () => { throw new Error('offline'); },
    async () => ({ ok: false, status: 503 }),
    async () => ({ ok: true, json: async () => { throw new Error('invalid JSON'); } }),
    async () => ({ ok: true, json: async () => null }),
  ]) {
    mock.mock.mockImplementation(response);
    assert.equal((await lookupBook(apiIsbn)).status, 'network-error');
  }
});

test('timeout is recoverable and caller cancellation rejects', async (t) => {
  t.mock.method(globalThis, 'fetch', (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
  }));
  assert.equal((await lookupBook(apiIsbn, { timeoutMs: 5 })).status, 'network-error');
  const controller = new AbortController();
  const promise = lookupBook(apiIsbn, { signal: controller.signal });
  controller.abort();
  await assert.rejects(promise);
});

test('invalid ISBN never reaches the API', async (t) => {
  t.mock.method(globalThis, 'fetch');
  await assert.rejects(lookupBook('9780262033849'), /valid ISBN-13/);
  assert.equal(globalThis.fetch.mock.callCount(), 0);
});

test('Selling handoff preserves metadata without sharing mutable arrays', () => {
  const book = { ...DEMO_BOOKS[0], authors: [...DEMO_BOOKS[0].authors] };
  prepareSellingBook(book);
  book.authors.push('Changed');
  const pending = getPendingSellingBook();
  assert.deepEqual(pending.authors, DEMO_BOOKS[0].authors);
  pending.authors.push('Also changed');
  assert.deepEqual(getPendingSellingBook().authors, DEMO_BOOKS[0].authors);
});

test('asking prices parse exactly as CAD cents, including decimal commas', () => {
  for (const [value, expected] of [
    ['25', 2500], ['25.5', 2550], ['25,50', 2550], [' 0.01 ', 1], ['9999.99', 999999],
  ]) assert.equal(parseCadPrice(value), expected);
  for (const value of ['', '0', '0.00', '-10', 'Infinity', '1e3', '10000', '10.123', '$25', '1,234.56']) {
    assert.equal(parseCadPrice(value), null, value);
  }
  assert.equal(formatCad(2550), '$25.50 CAD');
});

test('local tickets retain condition, photo and price with unique stable QR identities', () => {
  const draft = { book: DEMO_BOOKS[0], condition: 'Good', priceCents: 2500, photoUri: 'file:///book.jpg' };
  const ticket = createLocalTicket(draft);
  const second = createLocalTicket(draft);
  assert.notEqual(ticket.id, second.id);
  assert.equal(ticket.priceCents, 2500);
  assert.equal(ticket.condition, 'Good');
  assert.equal(ticket.photoUri, draft.photoUri);
  assert.equal(ticket.status, 'Awaiting drop-off');
  assert.equal(ticketQrValue(ticket), `booksforless:ticket:${ticket.id}`);
  assert.equal(ticketQrValue(ticket), ticketQrValue(ticket));
  assert.notEqual(ticket.book.authors, draft.book.authors);
  const qr = require('qrcode').create(ticketQrValue(ticket));
  assert.ok(qr.modules.size >= 21);
});

test('invalid ticket drafts cannot create a QR ticket', () => {
  const draft = { book: DEMO_BOOKS[0], condition: 'Good', priceCents: 2500, photoUri: 'file:///book.jpg' };
  for (const changes of [
    { photoUri: '' }, { condition: 'Unknown' }, { priceCents: 0 },
    { priceCents: 0.5 }, { priceCents: NaN }, { priceCents: 1000000 },
    { book: { ...draft.book, title: '' } },
  ]) assert.throws(() => createLocalTicket({ ...draft, ...changes }), /required/);
});

test('pickup orders need no address and keep unique, stable scannable QR identities', () => {
  const draft = {
    isbn: DEMO_ISBN, title: 'Introduction to Algorithms', condition: 'Good',
    price: 25, paymentMethod: 'Visa •••• 1111',
  };
  const order = addOrder(draft);
  const second = addOrder(draft);
  assert.notEqual(order.id, second.id);
  assert.equal(order.price, draft.price);
  assert.equal(Object.hasOwn(order, 'shippingAddress'), false);
  assert.ok(order.createdAt instanceof Date);
  assert.equal(pickupQrValue(order), `booksforless:pickup:${order.id}`);
  assert.equal(pickupQrValue(order), pickupQrValue(order));
  assert.notEqual(pickupQrValue(order), pickupQrValue(second));
  assert.equal(pickupQrValue(order).includes(draft.paymentMethod), false);
  assert.ok(require('qrcode').create(pickupQrValue(order)).modules.size >= 21);
});

test('experience ratings are optional and only accepted after confirmation', () => {
  const key = 'sale:unit-test-one';
  assert.equal(getBookFeedback(key), getBookFeedback(key), 'stable empty snapshot');
  rateBookExperience(key, 4);
  assert.deepEqual(getBookFeedback(key), { completed: false, rating: null });
  setBookCompleted(key, true);
  assert.deepEqual(getBookFeedback(key), { completed: true, rating: null });
  rateBookExperience(key, 4);
  assert.deepEqual(getBookFeedback(key), { completed: true, rating: 4 });
  for (const invalid of [0, 6, -1, 2.5, NaN, Infinity]) rateBookExperience(key, invalid);
  assert.equal(getBookFeedback(key).rating, 4);
});

test('selling and receiving confirmations are separate and can be undone', () => {
  setBookCompleted('sale:unit-test-two', true);
  rateBookExperience('sale:unit-test-two', 5);
  assert.deepEqual(getBookFeedback('purchase:unit-test-two'), { completed: false, rating: null });
  setBookCompleted('purchase:unit-test-two', true);
  rateBookExperience('purchase:unit-test-two', 3);
  setBookCompleted('sale:unit-test-two', false);
  assert.deepEqual(getBookFeedback('sale:unit-test-two'), { completed: false, rating: null });
  assert.deepEqual(getBookFeedback('purchase:unit-test-two'), { completed: true, rating: 3 });
});
