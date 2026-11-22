import { catalog } from '../repositories/catalog.js';
import { decodeMenuPhoto, saveMenuPhoto } from '../repositories/menuPhotos.js';

function positiveId(value) {
  const id = Number(value);
  return typeof value === 'string' && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(id) ? id : null;
}

export async function getCafes(_request, response) {
  response.json({ items: await catalog.listCafes() });
}

// ตรวจตัวกรองจาก URL แล้วส่งรายการเมนูกลับเป็น JSON
export async function getMenuItems(request, response) {
  const { cafeId, category, q } = request.query;
  if ((cafeId !== undefined && positiveId(cafeId) === null) ||
      (category !== undefined && typeof category !== 'string') ||
      (q !== undefined && typeof q !== 'string')) {
    return response.status(400).json({ error: { code: 'INVALID_FILTER', message: 'Use a positive café ID and text filters.' } });
  }
  response.json({ items: await catalog.listMenuItems({ cafeId: positiveId(cafeId) ?? undefined, category, q }) });
}

export async function getMenuItem(request, response) {
  const id = positiveId(request.params.id);
  if (id === null) {
    return response.status(400).json({ error: { code: 'INVALID_MENU_ITEM_ID', message: 'Use a positive menu item ID.' } });
  }
  const item = await catalog.findMenuItem(id);
  if (!item) {
    return response.status(404).json({ error: { code: 'MENU_ITEM_NOT_FOUND', message: 'Menu item not found.' } });
  }
  response.json(item);
}

const fields = {
  name: (v) => typeof v === 'string' && v.trim().length > 0 && v.trim().length <= 80,
  category: (v) => ['Coffee', 'Tea & More', 'Snacks'].includes(v),
  price: (v) => Number.isSafeInteger(v) && v >= 0 && v <= 999999,
  description: (v) => typeof v === 'string' && v.trim().length <= 160,
  imageUrl: (v) => v === null || (typeof v === 'string' && v.length <= 255 && /^(https:\/\/[^\s]+|\/figma\/[\w.-]+)$/.test(v)),
};

function parseMenu(body, partial) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const entries = Object.entries(body);
  if (!entries.length || entries.some(([key, value]) => !Object.hasOwn(fields, key) || !fields[key](value))) return null;
  if (!partial && ['name', 'category', 'price', 'description'].some((key) => !Object.hasOwn(body, key))) return null;
  return Object.fromEntries(entries.map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]));
}

export function validateStaffCafe(request, response, next) {
  const cafeId = positiveId(request.params.cafeId);
  if (!cafeId) return invalid(response);
  response.locals.catalogCafeId = cafeId;
  next();
}

function invalid(response) {
  return response.status(400).json({ error: { code: 'INVALID_MENU_ITEM', message: 'Check the menu fields and IDs.' } });
}

function missing(response) {
  return response.status(404).json({ error: { code: 'MENU_ITEM_NOT_FOUND', message: 'Item not found in this café.' } });
}

function invalidPhoto(response) {
  return response.status(400).json({ error: { code: 'INVALID_MENU_PHOTO', message: 'Choose a valid menu photo and try again.' } });
}

// ตรวจข้อมูลเมนูและรูป แล้วบันทึก URL ของไฟล์ไว้กับเมนู
export async function createMenuItem(request, response) {
  const { photo, ...fields } = request.body ?? {};
  const details = parseMenu(fields, false);
  if (!details) return invalid(response);
  const bytes = decodeMenuPhoto(photo);
  if (photo !== undefined && !bytes) return invalidPhoto(response);
  const cafeId = response.locals.catalogCafeId;
  if (!(await catalog.listCafes()).some((cafe) => cafe.cafeId === cafeId)) return missing(response);
  if (bytes) details.imageUrl = await saveMenuPhoto(bytes);
  response.status(201).json(await catalog.addMenuItem(cafeId, { imageUrl: null, ...details }));
}

export async function patchMenuItem(request, response) {
  const id = positiveId(request.params.id);
  const { photo, ...fields } = request.body ?? {};
  const bytes = decodeMenuPhoto(photo);
  if (photo !== undefined && !bytes) return invalidPhoto(response);
  const details = bytes && Object.keys(fields).length === 0 ? {} : parseMenu(fields, true);
  if (!id || !details) return invalid(response);
  const cafeId = response.locals.catalogCafeId;
  if (bytes) {
    // ตรวจว่าเมนูอยู่ในร้านนี้ก่อนบันทึกรูปใหม่
    const existing = await catalog.findMenuItem(id);
    if (existing?.cafeId !== cafeId) return missing(response);
    details.imageUrl = await saveMenuPhoto(bytes);
  }
  const item = await catalog.editMenuItem(cafeId, id, details);
  if (!item) return missing(response);
  response.json(item);
}

export async function deleteMenuItem(request, response) {
  const id = positiveId(request.params.id);
  if (!id) return invalid(response);
  if (!(await catalog.archiveMenuItem(response.locals.catalogCafeId, id))) return missing(response);
  response.status(204).end();
}
