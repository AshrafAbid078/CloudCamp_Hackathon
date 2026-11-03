// Local-only full workflow check. Never uses production credentials or databases.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const frontend = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = resolve(frontend, '..');
const working = await mkdtemp(join(tmpdir(), 'meridian-browser-'));
const children = [];
let browser;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function freePort() {
  const server = createServer(); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const port = server.address().port; await new Promise(resolve => server.close(resolve)); return port;
}
function launch(command, args, options) {
  const child = spawn(command, args, { ...options, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  child.on('error', error => { child.failure = error.message; });
  let log = '';
  for (const stream of [child.stdout, child.stderr]) stream.on('data', data => { log = (log + data).slice(-6000); });
  child.diagnostics = () => child.failure || log;
  children.push(child); return child;
}
async function ready(url, child) {
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null || child.failure) throw Error(child.diagnostics());
    try { if ((await fetch(url, { signal: AbortSignal.timeout(1000) })).ok) return; } catch {}
    await pause(100);
  }
  throw Error(`Local service did not start: ${child.diagnostics()}`);
}

try {
  const apiPort = await freePort(), webPort = await freePort();
  const api = `http://127.0.0.1:${apiPort}`, web = `http://127.0.0.1:${webPort}`;
  const localPython = join(root, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
  const python = process.env.PYTHON || (existsSync(localPython) ? localPython : 'python');
  const env = { ...process.env, TURSO_DATABASE_URL: '', TURSO_AUTH_TOKEN: '', GEMINI_API_KEY: '',
    ELECTRICITY_MAPS_API_KEY: '', LIVE_WEATHER_ENABLED: 'false', MERIDIAN_ENABLE_LIGHTGBM: '0',
    SECRET_KEY: 'isolated-browser-test-signing-key-not-for-production',
    INITIAL_ADMIN_PASSWORD: 'browser-test-bootstrap-password-2026',
    DB_PATH: join(working, 'test.db'), CORS_ORIGINS: web };
  const backend = launch(python, ['-m', 'uvicorn', 'main:app', '--app-dir', 'backend',
    '--host', '127.0.0.1', '--port', String(apiPort)], { cwd: root, env });
  await ready(`${api}/`, backend);
  const server = launch(process.execPath, [join(frontend, 'node_modules/next/dist/bin/next'),
    'start', '--hostname', '127.0.0.1', '--port', String(webPort)], {
    cwd: frontend, env: { ...env, API_INTERNAL_URL: api, NEXT_PUBLIC_API_URL: api } });
  await ready(web, server);
  async function request(path, method = 'GET', data, token) {
    const response = await fetch(api + path, { method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: data === undefined ? undefined : JSON.stringify(data) });
    assert.ok(response.ok, `${method} ${path}: HTTP ${response.status}`);
    return response.json();
  }
  const signed = await request('/auth/signup', 'POST', { username: 'browsertester', password: 'browser-test-password-2026' });
  let admin = await request('/auth/login', 'POST', { username: 'admin', password: env.INITIAL_ADMIN_PASSWORD });
  await request('/auth/me/password', 'PUT', { current_password: env.INITIAL_ADMIN_PASSWORD,
    new_password: 'changed-browser-admin-password-2026' }, admin.access_token);
  admin = await request('/auth/login', 'POST', { username: 'admin', password: 'changed-browser-admin-password-2026' });
  browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) });
  const visitor = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const publicPage = await visitor.newPage();
  for (const [path, heading] of [['/', 'A better time'], ['/about', 'Better energy decisions'], ['/guide', 'Understand the plan']]) {
    await publicPage.goto(web + path);
    await publicPage.getByRole('heading', { level: 1 }).filter({ hasText: heading }).waitFor();
    assert.equal(await publicPage.getByRole('button', { name: 'Toggle Language' }).count(), 0);
    await publicPage.setViewportSize({ width: 390, height: 844 });
    assert.ok(await publicPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${path} overflows mobile viewport`);
    await publicPage.setViewportSize({ width: 1440, height: 1000 });
  }
  await publicPage.getByRole('tab', { name: /Compare schedules/ }).click();
  await publicPage.getByRole('tabpanel').filter({ hasText: 'Find a feasible window' }).waitFor();
  await publicPage.getByRole('tab', { name: /Compare schedules/ }).press('ArrowRight');
  assert.equal(await publicPage.getByRole('tab', { name: /Review the plan/ }).getAttribute('aria-selected'), 'true');
  assert.equal(await publicPage.evaluate(() => localStorage.getItem('meridian_token')), null);
  await visitor.close();
  console.log('PASS: home, About and guide work without login; walkthrough supports mouse and keyboard');
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(token => {
    localStorage.setItem('meridian_token', token);
    localStorage.setItem('meridian_lang', 'bn'); // Old preferences must not translate the English-only UI.
  }, signed.access_token);
  const chatBodies = [];
  // NEXT_PUBLIC_API_URL is baked into the build; redirect only API calls to our isolated server.
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== web && /^\/(auth|forecast|dispatch|copilot|showcase|health)(\/|$)/.test(url.pathname)) {
      if (url.pathname === '/copilot/chat') chatBodies.push(route.request().postDataJSON());
      const response = await route.fetch({ url: api + url.pathname + url.search });
      await route.fulfill({ response, headers: { ...response.headers(), 'access-control-allow-origin': '*' } });
    } else await route.continue();
  });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(web + '/docs');
  await page.getByRole('heading', { name: 'Not Available', exact: true }).waitFor();
  assert.equal(await page.getByText('Core Builder', { exact: true }).count(), 0);
  await request('/showcase/admin/settings', 'PUT', { enabled: true, starts_at: null, ends_at: null }, admin.access_token);
  await page.reload();
  await page.getByRole('heading', { name: 'One plan for cleaner, more flexible energy.', exact: true }).waitFor();
  await request('/showcase/admin/settings', 'PUT', { enabled: false }, admin.access_token);
  await page.getByRole('heading', { name: 'Not Available', exact: true }).waitFor({ timeout: 15_000 });
  console.log('PASS: docs closed, published and revoked using actual admin controls');

  await page.goto(web + '/dispatch');
  await page.getByRole('button', { name: 'Save new plan', exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Toggle Language', exact: true }).count(), 0);
  assert.equal(await page.locator('h1').innerText(), 'Dispatch & Schedule Studio');
  console.log('PASS: English-only workspace ignores old language preferences');

  await page.getByRole('button', { name: /Add Custom Machine/ }).click();
  const previewResponse = page.waitForResponse(r => new URL(r.url()).pathname === '/dispatch/custom-asset');
  await page.getByRole('button', { name: 'Solve With Custom Machine', exact: true }).click();
  const preview = await (await previewResponse).json();
  await page.getByRole('status').filter({ hasText: 'successfully scheduled' }).waitFor();
  assert.equal(await page.locator('tr').filter({ hasText: 'Spinning Frame B2' }).count(), 1);
  const cost = preview.plan.kpis.cost_saved_usd;
  assert.equal(await page.locator('dd').first().innerText(), `${cost < 0 ? '−' : '+'}$${Math.abs(cost).toFixed(2)}`);
  await page.getByRole('button', { name: 'Save new plan', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'A new demo plan was saved' }).waitFor();
  await page.reload();
  await page.locator('tr').filter({ hasText: 'Spinning Frame B2' }).waitFor();
  const saved = await request('/dispatch/runs/latest', 'GET', undefined, signed.access_token);
  assert.ok(saved.plan.industrial.some(p => p.name === 'Spinning Frame B2'));
  assert.equal(saved.assumptions.custom_assets.length, 1);
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  console.log('PASS: full custom portfolio/KPIs survive save and reload; mobile width fits');

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(web + '/copilot');
  const input = page.getByPlaceholder(/Ask about/);
  for (const question of ['Show solar forecast', 'What happens if we install 200 kW solar?']) {
    await input.fill(question);
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    await page.getByRole('button', { name: 'Send', exact: true }).waitFor();
  }
  assert.equal(chatBodies.length, 2);
  assert.ok(chatBodies[1].conversation_history.some(turn => turn.text === 'Show solar forecast'));
  assert.ok(chatBodies[1].conversation_history.some(turn => turn.role === 'model'));
  assert.deepEqual(errors, []);
  console.log('PASS: multi-turn tool conversation carries history; no browser exceptions');
} finally {
  if (browser) await browser.close();
  await Promise.all(children.map(async child => {
    if (child.exitCode !== null) return;
    const stopped = once(child, 'exit'); child.kill(); await stopped;
  }));
  // Only remove the verified immediate temp directory created by this script.
  if (dirname(resolve(working)) === resolve(tmpdir()) && basename(working).startsWith('meridian-browser-'))
    await rm(working, { recursive: true, force: true });
}
