import catalog from '../../../database/kmutt-catalog.json' with { type: 'json' };
import { hashPassword } from './store.js';

export function createCampusState(password, retainedUsers = []) {
  const users = retainedUsers.map((user) => ({ ...user, role: 'customer', staffCafeIds: [] }));
  let nextId = Math.max(200, ...users.map((user) => user.userId));
  const addUser = (name, email, staffCafeIds = []) => {
    const user = { userId: ++nextId, name, email, passwordHash: hashPassword(password), role: staffCafeIds.length ? 'staff' : 'customer', staffCafeIds };
    users.push(user);
    return user;
  };
  addUser('Demo Customer', 'customer@example.test');
  const cafes = catalog.stores.map((store) => {
    const owner = addUser(`${store.name} Demo Owner`, store.account, [store.cafeId]);
    return { cafeId: store.cafeId, name: store.name, pickupPoint: store.pickupPoint, ownerUserId: owner.userId };
  });
  return { cafes, menu: catalog.stores.flatMap((store) => store.menu.map((item) => ({ ...item }))), users, sessions: [], favorites: [], orders: [], payments: [] };
}

export function repairCampusOwnership(state) {
  const assignments = catalog.stores.map(({ cafeId, name, account }) => ({
    cafe: state.cafes.find((entry) => entry.cafeId === cafeId && entry.name === name),
    owner: state.users.find((user) => user.email === account && user.staffCafeIds.length === 1 && user.staffCafeIds[0] === cafeId),
  }));
  const previousOwnerId = assignments[0].cafe?.ownerUserId;
  // Match the original reset's five-store grant before changing existing permissions.
  if (!previousOwnerId || !assignments.every(({ cafe, owner }) =>
    cafe?.ownerUserId === previousOwnerId && owner && owner.userId !== previousOwnerId)) return;

  const previousOwner = state.users.find((user) => user.userId === previousOwnerId && !user.email.endsWith('@example.test'));
  if (!previousOwner) return;

  const campusCafeIds = new Set(assignments.map(({ cafe }) => cafe.cafeId));
  previousOwner.staffCafeIds = previousOwner.staffCafeIds.filter((id) => !campusCafeIds.has(id));
  previousOwner.role = previousOwner.staffCafeIds.length ? 'staff' : 'customer';
  for (const { cafe, owner } of assignments) {
    cafe.ownerUserId = owner.userId;
    if (owner.name === `${cafe.name} Demo Staff`) owner.name = `${cafe.name} Demo Owner`;
  }
}
