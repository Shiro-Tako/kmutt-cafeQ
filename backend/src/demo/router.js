import { Router } from 'express';
import { createHash, randomBytes } from 'node:crypto';
import { checkPassword, hashPassword, transact } from './store.js';

function fail(status, code, message) {
  throw Object.assign(new Error(message), { status, code });
}

const publicUser = ({ passwordHash, ...user }) => user;
const digest = (value) => createHash('sha256').update(value).digest('hex');
const cookie = (request) => request.headers.cookie?.split(';').map((entry) => entry.trim()).find((entry) => entry.startsWith('cafeq_session='))?.slice(14);

function userFrom(state, request) {
  const token = cookie(request);
  const session = token && state.sessions.find((entry) => entry.hash === digest(token) && entry.expires > Date.now());
  const user = session && state.users.find((entry) => entry.userId === session.userId);
  if (!user) fail(401, 'LOGIN_REQUIRED', 'Please log in.');
  return user;
}

function staffFrom(state, request) {
  const user = userFrom(state, request);
  if (!user.staffCafeIds.includes(Number(request.params.cafeId))) fail(403, 'STORE_ACCESS_DENIED', 'This account cannot manage this café.');
  return user;
}

export async function requireDemoStaff(request, _response, next) {
  try {
    await transact((state) => staffFrom(state, request));
    next();
  } catch (error) { next(error); }
}

function quote(state, body) {
  if (!body || !Number.isSafeInteger(body.cafeId) || !Array.isArray(body.items) || !body.items.length || body.items.length > 100) {
    fail(400, 'INVALID_CART', 'Choose a café and at least one item.');
  }
  const cafe = state.cafes.find((entry) => entry.cafeId === body.cafeId);
  if (!cafe) fail(400, 'INVALID_CAFE', 'Choose a valid café.');
  const quantities = new Map();
  for (const row of body.items) {
    if (!Number.isSafeInteger(row.menuItemId) || !Number.isSafeInteger(row.quantity) || row.quantity < 1 || row.quantity > 99) {
      fail(400, 'INVALID_QUANTITY', 'Quantity must be from 1 to 99.');
    }
    const count = (quantities.get(row.menuItemId) ?? 0) + row.quantity;
    if (count > 99) fail(400, 'INVALID_QUANTITY', 'Maximum quantity is 99 per item.');
    quantities.set(row.menuItemId, count);
  }
  const items = [...quantities].sort(([a], [b]) => a - b).map(([id, quantity]) => {
    const item = state.menu.find((entry) => entry.menuItemId === id && entry.cafeId === cafe.cafeId && entry.isActive);
    if (!item) fail(409, 'ITEM_UNAVAILABLE', 'A menu item is unavailable in this café.');
    return { menuItemId: id, name: item.name, unitPrice: item.price, quantity };
  });
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  return { cafeId: cafe.cafeId, pickupPoint: cafe.pickupPoint, items, subtotal, packagingFee: 500, total: subtotal + 500 };
}

function confirmationFingerprint(body) {
  if (!Array.isArray(body?.items)) fail(400, 'INVALID_CART', 'Items are required.');
  const items = new Map();
  for (const item of body.items) {
    if (!Number.isSafeInteger(item.menuItemId) || !Number.isSafeInteger(item.quantity) || item.quantity < 1) {
      fail(400, 'INVALID_CART', 'Check the order items.');
    }
    items.set(item.menuItemId, (items.get(item.menuItemId) ?? 0) + item.quantity);
  }
  return digest(JSON.stringify([body.cafeId, [...items].sort(([a], [b]) => a - b), body.expectedTotal]));
}

const router = Router();

router.post('/auth/register', async (request, response) => {
  const result = await transact((state) => {
    const { name, email, password } = request.body ?? {};
    if (typeof name !== 'string' || !name.trim() || name.length > 80 ||
        typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
        typeof password !== 'string' || password.length < 8 || password.length > 128) {
      fail(400, 'INVALID_ACCOUNT', 'Enter a name, valid email and password of 8 to 128 characters.');
    }
    const normalized = email.trim().toLowerCase();
    if (state.users.some((user) => user.email === normalized)) fail(409, 'EMAIL_EXISTS', 'This email is already registered.');
    const user = { userId: Math.max(200, ...state.users.map((entry) => entry.userId)) + 1, name: name.trim(), email: normalized, passwordHash: hashPassword(password), staffCafeIds: [] };
    state.users.push(user);
    return startSession(state, user);
  });
  setCookie(response, result.token);
  response.status(201).json(result.user);
});

function startSession(state, user) {
  const token = randomBytes(32).toString('hex');
  state.sessions = state.sessions.filter((entry) => entry.expires > Date.now());
  state.sessions.push({ hash: digest(token), userId: user.userId, expires: Date.now() + 86400000 });
  return { token, user: publicUser(user) };
}

function setCookie(response, token) {
  response.cookie('cafeq_session', token, { httpOnly: true, sameSite: 'strict', path: '/api', maxAge: 86400000 });
}

router.post('/auth/login', async (request, response) => {
  const result = await transact((state) => {
    const { email, password } = request.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string' || password.length > 128) fail(400, 'INVALID_ACCOUNT', 'Enter your email and password.');
    const user = state.users.find((entry) => entry.email === email.trim().toLowerCase());
    if (!user || !checkPassword(password, user.passwordHash)) fail(401, 'INVALID_LOGIN', 'Email or password is incorrect.');
    return startSession(state, user);
  });
  setCookie(response, result.token);
  response.json(result.user);
});

router.get('/auth/me', async (request, response) => {
  response.json(await transact((state) => publicUser(userFrom(state, request))));
});

router.post('/auth/logout', async (request, response) => {
  await transact((state) => { state.sessions = state.sessions.filter((entry) => entry.hash !== digest(cookie(request) ?? '')); });
  response.clearCookie('cafeq_session', { path: '/api', sameSite: 'strict', httpOnly: true });
  response.sendStatus(204);
});

router.get('/favorites', async (request, response) => {
  const items = await transact((state) => {
    const user = userFrom(state, request);
    return state.menu.filter((item) => item.isActive && state.favorites.some((entry) => entry.userId === user.userId && entry.menuItemId === item.menuItemId));
  });
  response.json({ items });
});

router.put('/favorites/:id', async (request, response) => {
  await transact((state) => {
    const user = userFrom(state, request);
    const id = Number(request.params.id);
    if (!state.menu.some((item) => item.menuItemId === id && item.isActive)) fail(404, 'ITEM_NOT_FOUND', 'Menu item not found.');
    if (!state.favorites.some((entry) => entry.userId === user.userId && entry.menuItemId === id)) state.favorites.push({ userId: user.userId, menuItemId: id });
  });
  response.sendStatus(204);
});

router.delete('/favorites/:id', async (request, response) => {
  await transact((state) => {
    const user = userFrom(state, request);
    state.favorites = state.favorites.filter((entry) => entry.userId !== user.userId || entry.menuItemId !== Number(request.params.id));
  });
  response.sendStatus(204);
});

router.post('/checkout/quote', async (request, response) => {
  response.json(await transact((state) => { userFrom(state, request); return quote(state, request.body); }));
});

router.post('/checkout/confirm', async (request, response) => {
  const result = await transact((state) => {
    const user = userFrom(state, request);
    const body = request.body;
    if (typeof body?.confirmationId !== 'string' || !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(body.confirmationId) || !Number.isSafeInteger(body.expectedTotal)) {
      fail(400, 'INVALID_CONFIRMATION', 'Review the total before confirming.');
    }
    const fingerprint = confirmationFingerprint(body);
    const existing = state.payments.find((entry) => entry.userId === user.userId && entry.confirmationId === body.confirmationId);
    if (existing) {
      if (existing.fingerprint !== fingerprint) fail(409, 'CONFIRMATION_CONFLICT', 'This confirmation was used for another order.');
      return { order: state.orders.find((entry) => entry.orderId === existing.orderId), repeated: true };
    }
    const calculated = quote(state, body);
    if (calculated.total !== body.expectedTotal) fail(409, 'PRICE_CHANGED', 'Prices have changed. Review the updated total.');
    const order = { ...calculated, orderId: Math.max(300, ...state.orders.map((entry) => entry.orderId)) + 1, userId: user.userId, customerName: user.name, status: 'Waiting', createdAt: new Date().toISOString() };
    state.orders.push(order);
    state.payments.push({ orderId: order.orderId, userId: user.userId, confirmationId: body.confirmationId, fingerprint, amount: order.total, method: 'demo', status: 'confirmed' });
    return { order, repeated: false };
  });
  response.status(result.repeated ? 200 : 201).json(result.order);
});

router.get('/orders', async (request, response) => {
  response.json({ items: await transact((state) => {
    const user = userFrom(state, request);
    return state.orders.filter((order) => order.userId === user.userId).reverse();
  }) });
});

router.get('/orders/:id', async (request, response) => {
  const order = await transact((state) => {
    const user = userFrom(state, request);
    return state.orders.find((entry) => entry.orderId === Number(request.params.id) && entry.userId === user.userId);
  });
  if (!order) fail(404, 'ORDER_NOT_FOUND', 'Order not found.');
  response.json(order);
});

router.get('/staff/cafes/:cafeId/orders', async (request, response) => {
  response.json({ items: await transact((state) => {
    staffFrom(state, request);
    return state.orders.filter((order) => order.cafeId === Number(request.params.cafeId) && (!request.query.status || order.status === request.query.status)).reverse();
  }) });
});

router.patch('/staff/cafes/:cafeId/orders/:id/status', async (request, response) => {
  response.json(await transact((state) => {
    staffFrom(state, request);
    const order = state.orders.find((entry) => entry.orderId === Number(request.params.id) && entry.cafeId === Number(request.params.cafeId));
    if (!order) fail(404, 'ORDER_NOT_FOUND', 'Order not found.');
    if (order.status === request.body?.status) return order;
    const statuses = ['Waiting', 'Preparing', 'Ready', 'Done'];
    if (!statuses.includes(request.body?.status) || statuses[statuses.indexOf(order.status) + 1] !== request.body.status) fail(409, 'INVALID_STATUS_TRANSITION', 'Move the order to the next status.');
    order.status = request.body.status;
    return order;
  }));
});

export default router;
