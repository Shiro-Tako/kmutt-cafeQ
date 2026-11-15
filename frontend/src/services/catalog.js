import { requestJson } from './api.js';

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
  const { items } = await requestJson('/cafes', { signal });
  return items;
}

export async function fetchMenuItems({ cafeId, category, query }, signal) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (cafeId) params.set('cafeId', cafeId);
  if (query?.trim()) params.set('q', query.trim());
  const { items } = await requestJson(`/menu-items?${params}`, { signal });
  return items;
}

export function toMenuItem(row, cafes) {
  return {
    ...row,
    id: demoItemIds[row.menuItemId] ?? String(row.menuItemId),
    cafe: cafes.find((cafe) => cafe.cafeId === row.cafeId)?.name,
    price: row.price / 100,
    image: row.imageUrl,
    archived: !row.isActive,
  };
}

export function writeMenuItem(cafeId, id, details) {
  return requestJson(`/staff/cafes/${cafeId}/menu-items${id ? `/${id}` : ''}`, {
    method: details ? (id ? 'PATCH' : 'POST') : 'DELETE',
    body: details && { ...details, price: Math.round(details.price * 100) },
  });
}
