import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile } from 'node:fs/promises';
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
    const cafeListBefore = await (await request('/cafes')).json();
    assert.equal((await request('/auth/store-register', 'POST', store)).status, 404);
    assert.equal((await request('/auth/store-register', 'POST', store, staff)).status, 404);
    assert.deepEqual(await (await request('/cafes')).json(), cafeListBefore);
    const owner = await (await request('/auth/me', 'GET', undefined, staff)).json();
    const cafeId = owner.staffCafeIds[0];
    const teamPath = `/staff/cafes/${cafeId}/team`;
    assert.equal((await request(teamPath)).status, 401);
    assert.equal((await request(teamPath, 'POST', { email: 'x@example.test' }, otherStaff)).status, 403);
    assert.equal((await request(teamPath, 'POST', { name: 'Helper', email: 'helper@example.test', password: 'short' }, staff)).status, 400);
    assert.equal((await request(teamPath, 'POST', { name: 'Helper', email: 'helper@example.test', password: 'CafeQ123!' }, staff)).status, 201);
    const helperCookie = await login('helper@example.test');
    assert.equal((await request(`/staff/cafes/${cafeId}/orders`, 'GET', undefined, helperCookie)).status, 200);
    assert.equal((await request('/staff/cafes/2/orders', 'GET', undefined, helperCookie)).status, 403);
    assert.equal((await request(teamPath, 'POST', { email: 'customer@example.test' }, helperCookie)).status, 403);
    assert.equal((await request(teamPath, 'POST', { email: 'customer@example.test' }, staff)).status, 201);
    assert.equal((await request(teamPath, 'POST', { email: 'customer@example.test' }, staff)).status, 409);
    const team = await (await request(teamPath, 'GET', undefined, staff)).json();
    assert.equal(team.items.length, 3);
    assert.equal(team.ownerUserId, owner.userId);
    assert.equal(team.items.some((item) => 'passwordHash' in item), false);
    const buyer = { name: 'Another customer', email: 'buyer@example.test', password: 'CafeQ123!' };
    const registered = await request('/auth/register', 'POST', { ...buyer, staff: true, staffCafeIds: [cafeId] });
    assert.equal(registered.status, 201);
    assert.deepEqual((await registered.json()).staffCafeIds, []);
    assert.equal((await request('/auth/login', 'POST', { ...buyer, staff: true })).status, 403);
    assert.equal((await request('/staff/cafes/2/team', 'POST', { email: 'helper@example.test' }, otherStaff)).status, 409);
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

    const menuPath = '/staff/cafes/1/menu-items';
    const readPhoto = (filename) => readFile(new URL(`../../frontend/public/menu/${filename}`, import.meta.url));
    const firstPhoto = await readPhoto('1208.jpg');
    const replacement = await readPhoto('1504.jpg');
    const asPhoto = (bytes) => 'data:image/jpeg;base64,' + bytes.toString('base64');
    const details = { name: 'House tea with photo', category: 'Tea & More', description: '', price: 5500 };
    assert.equal((await request(menuPath, 'POST', { ...details, photo: asPhoto(firstPhoto) })).status, 401);
    assert.equal((await request(menuPath, 'POST', { ...details, photo: asPhoto(firstPhoto) }, otherStaff)).status, 403);
    assert.equal((await request(menuPath, 'POST', { ...details, photo: asPhoto(Buffer.from('not a photo')) }, staff)).status, 400);
    const created = await request(menuPath, 'POST', { ...details, photo: asPhoto(firstPhoto) }, staff);
    assert.equal(created.status, 201);
    const { menuItemId, imageUrl } = await created.json();
    const original = await fetch(origin + imageUrl);
    assert.equal(original.headers.get('content-type'), 'image/jpeg');
    assert.deepEqual(Buffer.from(await original.arrayBuffer()), firstPhoto);
    const edited = await request(`${menuPath}/${menuItemId}`, 'PATCH', { photo: asPhoto(replacement) }, staff);
    assert.equal(edited.status, 200);
    const editedItem = await edited.json();
    assert.notEqual(editedItem.imageUrl, imageUrl);
    assert.equal(editedItem.price, details.price);
    await stop();
    await start();
    const publicItem = await (await request('/menu-items/' + menuItemId)).json();
    assert.equal(publicItem.imageUrl, editedItem.imageUrl);
    const restoredPhoto = await fetch(origin + publicItem.imageUrl);
    assert.deepEqual(Buffer.from(await restoredPhoto.arrayBuffer()), replacement);
    const restoredTeam = await (await request(teamPath, 'GET', undefined, staff)).json();
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
