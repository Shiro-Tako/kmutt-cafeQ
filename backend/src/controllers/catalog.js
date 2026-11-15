import { findMenuItem, listCafes, listMenuItems } from '../repositories/catalog.js';

function positiveId(value) {
  const id = Number(value);
  return typeof value === 'string' && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(id) ? id : null;
}

export async function getCafes(_request, response) {
  response.json({ items: await listCafes() });
}

export async function getMenuItems(request, response) {
  const { cafeId, category, q } = request.query;
  if ((cafeId !== undefined && positiveId(cafeId) === null) ||
      (category !== undefined && typeof category !== 'string') ||
      (q !== undefined && typeof q !== 'string')) {
    return response.status(400).json({ error: { code: 'INVALID_FILTER', message: 'Use a positive café ID and text filters.' } });
  }
  response.json({ items: await listMenuItems({ cafeId: positiveId(cafeId) ?? undefined, category, q }) });
}

export async function getMenuItem(request, response) {
  const id = positiveId(request.params.id);
  if (id === null) {
    return response.status(400).json({ error: { code: 'INVALID_MENU_ITEM_ID', message: 'Use a positive menu item ID.' } });
  }
  const item = await findMenuItem(id);
  if (!item) {
    return response.status(404).json({ error: { code: 'MENU_ITEM_NOT_FOUND', message: 'Menu item not found.' } });
  }
  response.json(item);
}
