// ทดสอบข้อความแจ้งเตือนเมื่อออเดอร์พร้อมรับหรือเสร็จแล้ว
import test from 'node:test';
import assert from 'node:assert/strict';
import { getOrderNotification } from './orderNotifications.js';

const cafes = [{ cafeId: 4, name: 'Fresh Me — Library N10' }];
const order = { orderId: 301, createdAt: '2026-11-20T00:00:00Z', cafeId: 4, pickupPoint: 'Library N10', queueNumber: 3 };

test('only Ready and Done create notifications with distinct status events', () => {
  for (const status of ['Waiting', 'Preparing']) assert.equal(getOrderNotification({ ...order, status }, cafes), null);
  const ready = getOrderNotification({ ...order, status: 'Ready' }, cafes);
  const done = getOrderNotification({ ...order, status: 'Done' }, cafes);
  assert.match(ready.title, /ready/);
  assert.match(done.title, /completed/);
  assert.notEqual(ready.key, done.key);
  assert.equal(done.cafe, cafes[0].name);
  assert.equal(done.pickupPoint, order.pickupPoint);
  assert.equal(done.queueNumber, 3);
});

test('a poll that sees only Done still produces a completion notification', () => {
  const done = getOrderNotification({ ...order, status: 'Done' }, cafes);
  assert.ok(done);
  assert.equal(getOrderNotification({ ...order, status: 'Done' }, cafes).key, done.key);
  const reused = getOrderNotification({ ...order, createdAt: '2026-11-21T00:00:00Z', status: 'Done' }, cafes);
  assert.notEqual(reused.key, done.key);
});
