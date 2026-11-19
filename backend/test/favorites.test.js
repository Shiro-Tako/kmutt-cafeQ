import assert from 'node:assert/strict';
import { once } from 'node:events';
import express from 'express';
import test from 'node:test';
import { createFavoritesRouter } from '../src/routes/favorites.js';

function createMemoryFavoritesRepository() {
  const menuItems = new Map([
    [101, { menuItemId: 101, cafeId: 1, name: 'Iced Americano', price: 5500, isActive: true }],
    [102, { menuItemId: 102, cafeId: 1, name: 'Archived drink', price: 4000, isActive: false }],
  ]);
  const favorites = new Map();
  function userFavorites(userId) {
    if (!favorites.has(userId)) favorites.set(userId, new Set());
    return favorites.get(userId);
  }

  return {
    async listForUser(userId) {
      return [...userFavorites(userId)]
        .map((menuItemId) => menuItems.get(menuItemId))
        .filter((item) => item?.isActive);
    },
    async addForUser(userId, menuItemId) {
      const item = menuItems.get(menuItemId);
      if (!item) return 'not_found';
      if (!item.isActive) return 'unavailable';
      userFavorites(userId).add(menuItemId);
      return 'saved';
    },
    async removeForUser(userId, menuItemId) {
      userFavorites(userId).delete(menuItemId);
    },
  };
}

test('favorites require a session and are private, idempotent, and limited to active items', async () => {
  const app = express();
  const repository = createMemoryFavoritesRepository();
  const service = {
    async authenticateToken(token) {
      if (token === 'customer-one') return { userId: 1, name: 'Customer One', email: 'one@example.test', staffCafeIds: [] };
      if (token === 'customer-two') return { userId: 2, name: 'Customer Two', email: 'two@example.test', staffCafeIds: [] };
      return null;
    },
  };
  app.use('/api', createFavoritesRouter({ repository, service }));
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const base = `http://127.0.0.1:${server.address().port}/api/favorites`;
    const request = (path, method, token) => fetch(`${base}${path}`, {
      method,
      headers: token ? { Cookie: `cafeq_session=${token}` } : {},
    });

    assert.equal((await request('', 'GET')).status, 401);
    assert.equal((await request('/101', 'PUT', 'customer-one')).status, 204);
    assert.equal((await request('/101', 'PUT', 'customer-one')).status, 204);
    assert.deepEqual((await (await request('', 'GET', 'customer-one')).json()).items.map(({ menuItemId }) => menuItemId), [101]);
    assert.deepEqual((await (await request('', 'GET', 'customer-two')).json()).items, []);

    assert.equal((await request('/999', 'PUT', 'customer-one')).status, 404);
    const unavailable = await request('/102', 'PUT', 'customer-one');
    assert.equal(unavailable.status, 409);
    assert.equal((await unavailable.json()).error.code, 'ITEM_UNAVAILABLE');
    assert.equal((await request('/0', 'PUT', 'customer-one')).status, 400);

    assert.equal((await request('/101', 'DELETE', 'customer-one')).status, 204);
    assert.deepEqual((await (await request('', 'GET', 'customer-one')).json()).items, []);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
