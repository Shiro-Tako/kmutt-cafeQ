// เลือกแหล่งข้อมูลเมนูตามค่าตั้ง เช่น เดโม MySQL หรือข้อมูลจำลอง
import { mysqlCatalog } from './mysqlCatalog.js';
import { demoCatalog } from '../demo/catalog.js';

const cafes = [
  { cafeId: 1, name: 'Cafe Rung', pickupPoint: 'Cafe Rung pickup counter' },
  { cafeId: 2, name: 'Food Court', pickupPoint: 'Food Court pickup counter' },
];

const menu = [
  { menuItemId: 101, name: 'Iced Americano', category: 'Coffee', price: 5500, imageUrl: '/figma/c78c7.png', description: 'Double espresso and water, served cold', cafeId: 1, isActive: true },
  { menuItemId: 102, name: 'Iced Coffee Sweet Heaven', category: 'Coffee', price: 7000, imageUrl: '/figma/e532a.png', description: 'Double espresso with condensed milk, served cold', cafeId: 1, isActive: true },
  { menuItemId: 103, name: 'Hot Cappuccino', category: 'Coffee', price: 4000, imageUrl: '/figma/dda84.png', description: 'Double espresso and fresh milk, served hot', cafeId: 1, isActive: true },
  { menuItemId: 104, name: 'Iced Cappuccino', category: 'Coffee', price: 4500, imageUrl: '/figma/6f32b.png', description: 'Double espresso and fresh milk, served cold', cafeId: 1, isActive: true },
  { menuItemId: 105, name: 'Iced Coffee Lemonade', category: 'Coffee', price: 5500, imageUrl: '/figma/dd102.png', description: 'Double espresso with fresh lemonade, served cold', cafeId: 1, isActive: true },
  { menuItemId: 106, name: 'Iced Mocha', category: 'Coffee', price: 5500, imageUrl: '/figma/2532d.png', description: 'Double espresso and chocolate, served cold', cafeId: 1, isActive: true },
  { menuItemId: 107, name: 'Iced Lemonade', category: 'Tea & More', price: 4500, imageUrl: '/figma/c468c.png', description: 'Fresh lemon over ice', cafeId: 1, isActive: true },
  { menuItemId: 108, name: 'Iced Chocolate', category: 'Tea & More', price: 6000, imageUrl: '/figma/d790d.png', description: 'Chocolate and milk, served cold', cafeId: 1, isActive: true },
  { menuItemId: 109, name: 'Hot Chocolate', category: 'Tea & More', price: 5000, imageUrl: '/figma/39bbc.png', description: 'Warm chocolate and steamed milk', cafeId: 1, isActive: true },
  { menuItemId: 110, name: 'Iced Lemon Tea', category: 'Tea & More', price: 5500, imageUrl: '/figma/dd102.png', description: 'Chilled tea with lemon', cafeId: 1, isActive: true },
  { menuItemId: 111, name: 'Thai Milk Tea', category: 'Tea & More', price: 4000, imageUrl: null, description: 'Thai tea with milk over ice', cafeId: 2, isActive: true },
  { menuItemId: 112, name: 'Chocolate Cake', category: 'Snacks', price: 6500, imageUrl: null, description: 'A slice of chocolate cake', cafeId: 2, isActive: true },
];

export async function listCafes() {
  return cafes;
}

export async function listMenuItems({ cafeId, category, q = '' }) {
  const query = q.trim().toLowerCase();
  return menu.filter((item) =>
    item.isActive &&
    (cafeId === undefined || item.cafeId === cafeId) &&
    (category === undefined || item.category === category) &&
    item.name.toLowerCase().includes(query),
  );
}

export async function findMenuItem(id) {
  return menu.find((item) => item.menuItemId === id && item.isActive) ?? null;
}

let nextId = 113;
const mockCatalog = {
  listCafes,
  listMenuItems,
  findMenuItem,
  async addMenuItem(cafeId, details) {
    const item = { imageUrl: null, ...details, menuItemId: nextId++, cafeId, isActive: true };
    menu.push(item);
    return item;
  },
  async editMenuItem(cafeId, id, details) {
    const item = await findMenuItem(id);
    return item?.cafeId === cafeId ? Object.assign(item, details) : null;
  },
  async archiveMenuItem(cafeId, id) {
    const item = await this.editMenuItem(cafeId, id, { isActive: false });
    return Boolean(item);
  },
};

export const catalog = process.env.DATA_STORE === 'mysql' ? demoCatalog
  : process.env.CATALOG_SOURCE === 'mysql' ? mysqlCatalog
  : process.env.CATALOG_SOURCE === 'mock' ? mockCatalog : demoCatalog;
