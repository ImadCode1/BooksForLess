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

const {
  CONDITION_MULTIPLIERS,
  DEFAULT_NEW_PRICE_CENTS,
  calculateSellingPrice,
  estimateNewPriceFromPages,
} = load('src/utils/pricing.ts');

test('selling price is the new price times the condition share, rounded to the dollar', () => {
  // Clean Code: new $45.99 → matches the store's own listings ($32 like new, $24 good, $15 acceptable).
  assert.equal(calculateSellingPrice(4599, 'Like New'), 3200);
  assert.equal(calculateSellingPrice(4599, 'Good'), 2400);
  assert.equal(calculateSellingPrice(4599, 'Fair'), 1600);
  assert.equal(calculateSellingPrice(4599, 'Poor'), 700);
});

test('better condition never pays less, and price is never zero', () => {
  const order = ['Like New', 'Good', 'Fair', 'Poor'];
  for (let i = 1; i < order.length; i++) {
    assert.ok(CONDITION_MULTIPLIERS[order[i - 1]] > CONDITION_MULTIPLIERS[order[i]]);
  }
  assert.equal(calculateSellingPrice(100, 'Poor'), 100);
});

test('page-count estimate stays between $25 and $150', () => {
  assert.equal(estimateNewPriceFromPages(50), 2500);
  assert.equal(estimateNewPriceFromPages(800), 6400);
  assert.equal(estimateNewPriceFromPages(5000), 15000);
  assert.ok(DEFAULT_NEW_PRICE_CENTS > 0);
});
