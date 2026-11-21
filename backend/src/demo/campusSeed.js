import catalog from '../../../database/kmutt-catalog.json' with { type: 'json' };
import { hashPassword } from './store.js';

export function createCampusState(password, retainedUsers = [], ownerUserId) {
  const users = retainedUsers.map((user) => ({ ...user, role: 'customer', staffCafeIds: [] }));
  let nextId = Math.max(200, ...users.map((user) => user.userId));
  const addUser = (name, email, staffCafeIds = []) => {
    const user = { userId: ++nextId, name, email, passwordHash: hashPassword(password), role: staffCafeIds.length ? 'staff' : 'customer', staffCafeIds };
    users.push(user);
    return user;
  };
  addUser('Demo Customer', 'customer@example.test');
  const cafes = catalog.stores.map((store) => {
    const staff = addUser(`${store.name} Demo Staff`, store.account, [store.cafeId]);
    return { cafeId: store.cafeId, name: store.name, pickupPoint: store.pickupPoint, ownerUserId: ownerUserId ?? staff.userId };
  });
  if (ownerUserId) {
    const owner = users.find((user) => user.userId === ownerUserId);
    if (!owner) throw new Error('The retained store owner account was not found.');
    owner.staffCafeIds = cafes.map((cafe) => cafe.cafeId);
    owner.role = 'staff';
  }
  return { cafes, menu: catalog.stores.flatMap((store) => store.menu.map((item) => ({ ...item }))), users, sessions: [], favorites: [], orders: [], payments: [] };
}
