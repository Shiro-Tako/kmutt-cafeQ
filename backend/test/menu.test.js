import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import express from 'express';
import { createCatalogRouter } from '../src/routes/catalog.js';

test('catalog reads and store-scoped writes', async () => {
  const app = express();
  app.use(express.json());
  app.use('/api', createCatalogRouter((_request, response, next) => {
    if (response.locals.catalogCafeId === 1) return next();
    response.sendStatus(403);
  }));
  app.use('/without-auth', createCatalogRouter());
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const write = (path, method, body) => fetch(base + path, {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const path = '/api/staff/cafes/1/menu-items';
    const details = { name: 'Test tea', category: 'Tea & More', description: '', price: 4500 };
    assert.equal((await write(path.replace('/api', '/without-auth'), 'POST', details)).status, 503);
    assert.equal((await write(path.replace('/1/', '/2/'), 'POST', details)).status, 403);
    assert.equal((await write(path, 'POST', { ...details, price: -1 })).status, 400);
    assert.equal((await write(path + '/111', 'PATCH', { price: 4500 })).status, 404);
    const created = await write(path, 'POST', details);
    assert.equal(created.status, 201);
    const { menuItemId } = await created.json();
    const filtered = await fetch(base + '/api/menu-items?cafeId=1&category=Tea%20%26%20More&q=test');
    assert.deepEqual((await filtered.json()).items.map((item) => item.menuItemId), [menuItemId]);
    const edited = await write(path + '/' + menuItemId, 'PATCH', { price: 4700 });
    assert.equal((await edited.json()).price, 4700);
    assert.equal((await write(path + '/' + menuItemId, 'DELETE')).status, 204);
    assert.equal((await fetch(base + '/api/menu-items/' + menuItemId)).status, 404);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
