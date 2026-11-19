import { transact } from './store.js';

export const demoCatalog = {
  listCafes: () => transact((state) => state.cafes),
  listMenuItems: ({ cafeId, category, q = '' }) => transact((state) => state.menu.filter((item) =>
    item.isActive && (cafeId === undefined || item.cafeId === cafeId) &&
    (category === undefined || item.category === category) && item.name.toLowerCase().includes(q.trim().toLowerCase()),
  )),
  findMenuItem: (id) => transact((state) => state.menu.find((item) => item.menuItemId === id && item.isActive) ?? null),
  addMenuItem: (cafeId, details) => transact((state) => {
    const item = { ...details, cafeId, menuItemId: Math.max(100, ...state.menu.map((entry) => entry.menuItemId)) + 1, isActive: true };
    state.menu.push(item);
    return item;
  }),
  editMenuItem: (cafeId, id, details) => transact((state) => {
    const item = state.menu.find((entry) => entry.cafeId === cafeId && entry.menuItemId === id && entry.isActive);
    return item ? Object.assign(item, details) : null;
  }),
  archiveMenuItem: (cafeId, id) => transact((state) => {
    const item = state.menu.find((entry) => entry.cafeId === cafeId && entry.menuItemId === id && entry.isActive);
    if (!item) return false;
    item.isActive = false;
    return true;
  }),
};
