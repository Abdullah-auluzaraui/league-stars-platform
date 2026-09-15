const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

// Execute actual Server Action code with database and Next.js boundaries mocked.
function load(path, mocks = {}, env = {}) {
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports, Buffer, TextEncoder, console,
    process: { env },
    require(name) { if (name in mocks) return mocks[name]; throw new Error(`Unexpected module: ${name}`); },
  });
  return exports;
}

test('demo is disabled with missing or partial configuration', () => {
  for (const env of [{}, { DEMO_MODE: 'true' }, { DEMO_DATABASE: 'true' }, { DEMO_MODE: 'false', DEMO_DATABASE: 'true' }]) {
    const demo = load('src/core/lib/demo.ts', {}, env);
    assert.equal(demo.isDemoEnabled(), false);
    assert.throws(() => demo.assertDemoEnabled());
  }
  assert.equal(load('src/core/lib/demo.ts', {}, { DEMO_MODE: 'true', DEMO_DATABASE: 'true' }).isDemoEnabled(), true);
});

function actionMocks(demo, prisma) {
  return {
    '@/core/lib/demo': demo,
    'next/navigation': { redirect() { throw new Error('REDIRECT'); } },
    bcryptjs: { compare: async () => true },
    zod: require('zod'),
    '@/core/lib/prisma': { prisma },
    '@/core/lib/auth': { signToken: async () => 'token', setAuthCookie: async () => {}, clearAuthCookie: async () => {} },
    '@/core/lib/validation': { validateAction() { throw new Error('Not expected'); } },
  };
}

test('disabled one-click login never queries the database', async () => {
  const demo = load('src/core/lib/demo.ts');
  const actions = load('src/app/admin-login/actions.ts', actionMocks(demo, {}));
  const result = await actions.demoLogin();
  assert.ok(result.error);
});

test('enabled one-click login selects only the dedicated demo admin', async () => {
  const demo = load('src/core/lib/demo.ts', {}, { DEMO_MODE: 'true', DEMO_DATABASE: 'true' });
  let where;
  const prisma = { user: { findFirst: async (args) => { where = args.where; return null; } } };
  const actions = load('src/app/admin-login/actions.ts', actionMocks(demo, prisma));
  await actions.demoLogin();
  assert.equal(where.username, 'demo-admin');
  assert.equal(where.role, 'admin');
});

test('reset is blocked before any database deletion outside demo mode', async () => {
  const demo = load('src/core/lib/demo.ts');
  const reset = load('src/core/lib/demoReset.ts', { './demo': demo, '@/core/lib/prisma': { prisma: {} }, bcryptjs: {} });
  await assert.rejects(reset.executeDemoReset(), /Demo operations require/);
});

test('manual demo-password login is also blocked outside demo mode', async () => {
  const demo = load('src/core/lib/demo.ts');
  const mocks = actionMocks(demo, {});
  mocks['@/core/lib/validation'] = { validateAction: () => ({ success: true, data: { username: 'demo-admin', password: 'demo123456' } }) };
  const result = await load('src/app/admin-login/actions.ts', mocks).login(null, { get: () => '' });
  assert.ok(result.error);
});
