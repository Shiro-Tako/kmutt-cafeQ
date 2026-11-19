import assert from 'node:assert/strict';
import { once } from 'node:events';
import express from 'express';
import test from 'node:test';
import { createRequireStaffCafe } from '../src/middleware/auth.js';
import { createAuthRouter } from '../src/routes/auth.js';
import { createAuthService } from '../src/services/auth.js';

function createMemoryRepository() {
  const users = new Map();
  const sessions = new Map();
  const staffCafeIds = new Map();
  let nextUserId = 1;

  return {
    staffCafeIds,
    async findUserByEmail(email) {
      return users.get(email) ?? null;
    },
    async registerUser({ name, email, passwordHash, tokenHash, expiresAt }) {
      if (users.has(email)) {
        const error = new Error('Duplicate email');
        error.code = 'ER_DUP_ENTRY';
        throw error;
      }
      const user = { userId: nextUserId++, name, email, passwordHash };
      users.set(email, user);
      sessions.set(tokenHash, { userId: user.userId, expiresAt });
      return { userId: user.userId, name, email };
    },
    async createSession({ userId, tokenHash, expiresAt }) {
      sessions.set(tokenHash, { userId, expiresAt });
    },
    async findUserBySessionHash(tokenHash) {
      const session = sessions.get(tokenHash);
      if (!session || session.expiresAt <= new Date()) return null;
      const user = [...users.values()].find(({ userId }) => userId === session.userId);
      if (!user) return null;
      return {
        userId: user.userId,
        name: user.name,
        email: user.email,
        staffCafeIds: staffCafeIds.get(user.userId) ?? [],
      };
    },
    async deleteSession(tokenHash) {
      sessions.delete(tokenHash);
    },
  };
}

test('account registration, login, session lifecycle, and café staff authorization', async () => {
  const repository = createMemoryRepository();
  const service = createAuthService(repository);
  const app = express();
  app.use(express.json());
  app.use('/api', createAuthRouter(service));
  app.get('/staff/:cafeId', (request, response, next) => {
    response.locals.catalogCafeId = Number(request.params.cafeId);
    next();
  }, createRequireStaffCafe(service), (request, response) => response.json(request.user));

  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const register = await fetch(`${base}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Staff Demo', email: 'STAFF@example.test', password: 'password123' }),
    });
    assert.equal(register.status, 201);
    const user = await register.json();
    assert.deepEqual(user, {
      userId: 1,
      name: 'Staff Demo',
      email: 'staff@example.test',
      staffCafeIds: [],
    });
    const cookie = register.headers.get('set-cookie').split(';')[0];
    assert.match(register.headers.get('set-cookie'), /HttpOnly/);

    repository.staffCafeIds.set(user.userId, [1]);
    const me = await fetch(`${base}/api/auth/me`, { headers: { Cookie: cookie } });
    assert.equal(me.status, 200);
    assert.deepEqual((await me.json()).staffCafeIds, [1]);
    assert.equal((await fetch(`${base}/staff/1`, { headers: { Cookie: cookie } })).status, 200);
    assert.equal((await fetch(`${base}/staff/2`, { headers: { Cookie: cookie } })).status, 403);

    const invalidLogin = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'staff@example.test', password: 'wrongpass' }),
    });
    assert.equal(invalidLogin.status, 401);

    const login = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'staff@example.test', password: 'password123' }),
    });
    assert.equal(login.status, 200);
    const loginCookie = login.headers.get('set-cookie').split(';')[0];

    const logout = await fetch(`${base}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: loginCookie },
    });
    assert.equal(logout.status, 204);
    assert.match(logout.headers.get('set-cookie'), /Max-Age=0/);
    assert.equal((await fetch(`${base}/api/auth/me`, { headers: { Cookie: loginCookie } })).status, 401);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('registration validates input and rejects duplicate email addresses', async () => {
  const app = express();
  app.use(express.json());
  app.use('/api', createAuthRouter(createAuthService(createMemoryRepository())));
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const url = `http://127.0.0.1:${server.address().port}/api/auth/register`;
    const submit = (body) => fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    assert.equal((await submit({ name: '', email: 'bad', password: 'short' })).status, 400);
    const details = { name: 'Customer', email: 'customer@example.test', password: 'password123' };
    assert.equal((await submit(details)).status, 201);
    const duplicate = await submit(details);
    assert.equal(duplicate.status, 409);
    assert.equal((await duplicate.json()).error.code, 'EMAIL_IN_USE');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
