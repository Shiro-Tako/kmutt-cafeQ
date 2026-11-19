import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { randomUUID } from 'node:crypto';

test('demo persists orders and rejects duplicate, stale and cross-store operations', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'cafeq-demo-test-'));
  const file = join(directory, 'state.json');
  let server;
  let origin;

  async function start() {
    server = spawn(process.execPath, ['src/server.js'], {
      cwd: new URL('../', import.meta.url),
      env: { ...process.env, PORT: '0', CATALOG_SOURCE: 'demo', DEMO_DATA_FILE: file },
      stdio: ['ignore', 'pipe', 'inherit'],
    });
    const [output] = await once(server.stdout, 'data');
    origin = output.toString().match(/http:\/\/127.0.0.1:\d+/)[0];
  }

  async function stop() {
    const stopped = once(server, 'exit');
    server.kill();
    await stopped;
  }

  function request(path, method = 'GET', body, cookie) {
    return fetch(origin + '/api' + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  async function login(email) {
    const response = await request('/auth/login', 'POST', { email, password: 'CafeQ123!' });
    assert.equal(response.status, 200);
    return response.headers.get('set-cookie').split(';')[0];
  }

  try {
    await start();
    const customer = await login('customer@example.test');
    const staff = await login('staff-rung@example.test');
    const otherStaff = await login('staff-foodcourt@example.test');
    assert.equal((await request('/orders')).status, 401);
    assert.equal((await request('/staff/cafes/1/orders', 'GET', undefined, otherStaff)).status, 403);
    const body = {
      cafeId: 1, items: [{ menuItemId: 101, quantity: 2 }],
      expectedTotal: 11500, confirmationId: randomUUID(),
    };
    const results = await Promise.all([request('/checkout/confirm', 'POST', body, customer), request('/checkout/confirm', 'POST', body, customer)]);
    assert.deepEqual(results.map((result) => result.status).sort(), [200, 201]);
    const order = await results[0].json();
    assert.equal(order.queueNumber, 1);
    assert.match(order.queueDate, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal((await request('/checkout/confirm', 'POST', { ...body, expectedTotal: 1 }, customer)).status, 409);
    assert.equal((await request('/checkout/quote', 'POST', { cafeId: 1, items: [{ menuItemId: 112, quantity: 1 }] }, customer)).status, 409);
    assert.equal((await request('/checkout/quote', 'POST', { cafeId: 1, items: [{ menuItemId: 101, quantity: 0 }] }, customer)).status, 400);
    const statusPath = '/staff/cafes/1/orders/' + order.orderId + '/status';
    assert.equal((await request(statusPath, 'PATCH', { status: 'Done' }, staff)).status, 409);
    for (const status of ['Preparing', 'Ready', 'Done']) {
      assert.equal((await request(statusPath, 'PATCH', { status }, staff)).status, 200);
    }
    assert.equal((await request(statusPath, 'PATCH', {}, staff)).status, 409);
    await request('/staff/cafes/1/menu-items/101', 'PATCH', { price: 9900 }, staff);
    await stop();
    await start();
    const history = await (await request('/orders', 'GET', undefined, customer)).json();
    assert.equal(history.items.length, 1);
    assert.equal(history.items[0].total, 11500);
    assert.equal(history.items[0].items[0].unitPrice, 5500);
    assert.equal((await request('/checkout/confirm', 'POST', body, customer)).status, 200);
    assert.equal((await request('/checkout/confirm', 'POST', { ...body, confirmationId: randomUUID() }, customer)).status, 409);
    await request('/auth/logout', 'POST', undefined, customer);
    assert.equal((await request('/orders', 'GET', undefined, customer)).status, 401);
  } finally {
    if (server?.exitCode === null) await stop();
  }
});
