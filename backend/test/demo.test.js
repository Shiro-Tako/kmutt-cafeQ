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
    const store = { name: 'New owner', email: 'owner@example.test', password: 'CafeQ123!', storeName: 'Campus Test Café', pickupPoint: 'Building 4' };
    const signup = await request('/auth/store-register', 'POST', store);
    assert.equal(signup.status, 201);
    const ownerCookie = signup.headers.get('set-cookie').split(';')[0];
    const owner = await signup.json();
    const cafeId = owner.staffCafeIds[0];
    const teamPath = `/staff/cafes/${cafeId}/team`;
    assert.equal((await request('/auth/store-register', 'POST', store)).status, 409);
    assert.equal((await request(teamPath)).status, 401);
    assert.equal((await request(teamPath, 'POST', { email: 'x@example.test' }, staff)).status, 403);
    assert.equal((await request(teamPath, 'POST', { name: 'Helper', email: 'helper@example.test', password: 'short' }, ownerCookie)).status, 400);
    assert.equal((await request(teamPath, 'POST', { name: 'Helper', email: 'helper@example.test', password: 'CafeQ123!' }, ownerCookie)).status, 201);
    const helperCookie = await login('helper@example.test');
    assert.equal((await request(`/staff/cafes/${cafeId}/orders`, 'GET', undefined, helperCookie)).status, 200);
    assert.equal((await request('/staff/cafes/1/orders', 'GET', undefined, helperCookie)).status, 403);
    assert.equal((await request(teamPath, 'POST', { email: 'customer@example.test' }, helperCookie)).status, 403);
    assert.equal((await request(teamPath, 'POST', { email: 'customer@example.test' }, ownerCookie)).status, 201);
    assert.equal((await request(teamPath, 'POST', { email: 'customer@example.test' }, ownerCookie)).status, 409);
    const team = await (await request(teamPath, 'GET', undefined, ownerCookie)).json();
    assert.equal(team.items.length, 3);
    assert.equal(team.ownerUserId, owner.userId);
    assert.equal(team.items.some((item) => 'passwordHash' in item), false);
    const existingCustomerStore = { ...store, name: 'Do not overwrite profile', email: ' CUSTOMER@example.test ', storeName: 'Customer-owned café' };
    assert.equal((await request('/auth/store-register', 'POST', { ...existingCustomerStore, password: 'WrongPassword123' })).status, 401);
    const upgrade = await request('/auth/store-register', 'POST', existingCustomerStore);
    assert.equal(upgrade.status, 201);
    const upgraded = await upgrade.json();
    assert.equal(upgraded.userId, 201);
    assert.equal(upgraded.name, 'Somchai');
    assert.equal(upgraded.staffCafeIds.length, 2);
    const customerTeam = await (await request(`/staff/cafes/${upgraded.staffCafeIds.at(-1)}/team`, 'GET', undefined, customer)).json();
    assert.equal(customerTeam.ownerUserId, 201);
    assert.equal((await request('/auth/store-register', 'POST', existingCustomerStore)).status, 409);
    assert.ok(await login('customer@example.test'));
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
    const pickupPath = '/orders/' + order.orderId + '/pickup';
    assert.equal((await request(pickupPath, 'PATCH', undefined, customer)).status, 409);
    assert.equal((await request(pickupPath, 'PATCH')).status, 401);
    for (const status of ['Preparing', 'Ready']) {
      assert.equal((await request(statusPath, 'PATCH', { status }, staff)).status, 200);
    }
    assert.equal((await request(pickupPath, 'PATCH', undefined, otherStaff)).status, 404);
    for (let attempt = 0; attempt < 2; attempt++) {
      const pickedUp = await request(pickupPath, 'PATCH', undefined, customer);
      assert.equal(pickedUp.status, 200);
      assert.equal((await pickedUp.json()).status, 'Done');
    }
    const shopOrder = await (await request('/staff/cafes/1/orders?status=Done', 'GET', undefined, staff)).json();
    assert.equal(shopOrder.items[0].orderId, order.orderId);
    assert.equal((await request(statusPath, 'PATCH', {}, staff)).status, 409);
    await request('/staff/cafes/1/menu-items/101', 'PATCH', { price: 9900 }, staff);
    await stop();
    await start();
    const restoredTeam = await (await request(teamPath, 'GET', undefined, ownerCookie)).json();
    assert.equal(restoredTeam.items.length, 3);
    assert.equal(restoredTeam.ownerUserId, owner.userId);
    const history = await (await request('/orders', 'GET', undefined, customer)).json();
    assert.equal(history.items.length, 1);
    assert.equal(history.items[0].total, 11500);
    assert.equal(history.items[0].status, 'Done');
    assert.equal(history.items[0].items[0].unitPrice, 5500);
    assert.equal((await request('/checkout/confirm', 'POST', body, customer)).status, 200);
    assert.equal((await request('/checkout/confirm', 'POST', { ...body, confirmationId: randomUUID() }, customer)).status, 409);
    await request('/auth/logout', 'POST', undefined, customer);
    assert.equal((await request('/orders', 'GET', undefined, customer)).status, 401);
  } finally {
    if (server?.exitCode === null) await stop();
  }
});
