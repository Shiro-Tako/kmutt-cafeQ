import { getJson } from './api.js';

// Keep the demo's existing basket and favorite IDs while the API uses numeric IDs.
export const demoItemIds = {
  101: 'americano',
  102: 'sweet-heaven',
  103: 'cappuccino',
  104: 'iced-cappuccino',
  105: 'coffee-lemonade',
  106: 'mocha',
  107: 'lemonade',
  108: 'iced-chocolate',
  109: 'hot-chocolate',
  110: 'lemon-tea',
  111: 'thai-tea',
  112: 'cake',
};

export const demoCafes = [
  { cafeId: 1, name: 'Cafe Rung' },
  { cafeId: 2, name: 'Food Court' },
];

export async function fetchCafes(signal) {
  const { items } = await getJson('/cafes', { signal });
  return items;
}

export async function fetchMenuItems({ cafeId, category, query }, signal) {
  const params = new URLSearchParams({ category });
  if (cafeId) params.set('cafeId', cafeId);
  if (query.trim()) params.set('q', query.trim());
  const { items } = await getJson(`/menu-items?${params}`, { signal });
  return items;
}
