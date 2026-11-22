// ทดสอบข้อมูลตั้งต้นของร้านและการย้ายสิทธิ์เจ้าของร้านเดิม
import assert from 'node:assert/strict';
import test from 'node:test';
import { createCampusState, repairCampusOwnership } from '../src/demo/campusSeed.js';
import { checkPassword, hashPassword } from '../src/demo/store.js';

test('campus catalog has five stores, twelve valid menu items each and working sample accounts', () => {
  const state = createCampusState('ExamplePassword123');
  assert.equal(state.cafes.length, 5);
  assert.equal(state.menu.length, 60);
  assert.equal(new Set(state.menu.map((item) => item.menuItemId)).size, 60);
  for (const cafe of state.cafes) {
    assert.equal(state.menu.filter((item) => item.cafeId === cafe.cafeId).length, 12);
    const owner = state.users.find((user) => user.userId === cafe.ownerUserId);
    assert.deepEqual(owner.staffCafeIds, [cafe.cafeId]);
    assert.ok(checkPassword('ExamplePassword123', owner.passwordHash));
  }
  for (const item of state.menu) {
    assert.ok(Number.isSafeInteger(item.price) && item.price > 0);
    assert.ok(item.description.length <= 160);
    assert.ok(['Coffee', 'Tea & More', 'Snacks'].includes(item.category));
    assert.match(item.description, /Demo item/);
  }
});

test('real accounts keep their identity and password without gaining campus store access', () => {
  const retained = [{ userId: 250, name: 'Existing owner', email: 'owner@university.invalid', phone: '0123456789', passwordHash: hashPassword('KeepMyPassword') }];
  const state = createCampusState('DemoPassword123', retained);
  const owner = state.users.find((user) => user.userId === 250);
  assert.equal(owner.name, retained[0].name);
  assert.equal(owner.email, retained[0].email);
  assert.equal(owner.phone, retained[0].phone);
  assert.equal(owner.passwordHash, retained[0].passwordHash);
  assert.deepEqual(owner.staffCafeIds, []);
  assert.ok(state.cafes.every((cafe) => cafe.ownerUserId !== 250));
  assert.equal(new Set(state.users.map((user) => user.userId)).size, state.users.length);
  assert.deepEqual(state.orders, []);
  assert.deepEqual(state.sessions, []);
  assert.deepEqual(state.favorites, []);
  assert.equal(retained[0].staffCafeIds, undefined);
});

test('legacy campus ownership transfers to the dedicated accounts and preserves unrelated roles', () => {
  const state = createCampusState('DemoPassword123', [{ userId: 250, name: 'Previous owner', email: 'owner@university.invalid' }]);
  const previousOwner = state.users[0];
  const expectedCafes = structuredClone(state.cafes);
  for (const cafe of state.cafes) cafe.ownerUserId = 250;
  state.cafes.push({ cafeId: 6, name: 'Independent Café', ownerUserId: 250 });
  previousOwner.staffCafeIds = [1, 2, 3, 4, 5, 6];

  repairCampusOwnership(state);
  repairCampusOwnership(state);
  assert.deepEqual(state.cafes.slice(0, 5), expectedCafes);
  assert.equal(state.cafes[5].ownerUserId, 250);
  assert.deepEqual(previousOwner.staffCafeIds, [6]);
  assert.equal(previousOwner.role, 'staff');
});
