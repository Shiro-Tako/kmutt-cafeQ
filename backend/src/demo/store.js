import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { listCafes, listMenuItems } from '../repositories/catalog.js';
import { transactMysql } from './mysqlStore.js';

const file = process.env.DEMO_DATA_FILE || fileURLToPath(new URL('../../data/demo.json', import.meta.url));
let queue = Promise.resolve();

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return salt + ':' + scryptSync(password, salt, 64).toString('hex');
}

export function checkPassword(password, encoded) {
  const [salt, hash] = encoded.split(':');
  return timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(hash, 'hex'));
}

async function read() {
  try {
    const state = JSON.parse(await readFile(file, 'utf8'));
    for (const cafe of state.cafes) {
      cafe.ownerUserId ??= state.users.find((user) => user.staffCafeIds.includes(cafe.cafeId))?.userId;
    }
    return state;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return createInitialState();
  }
}

export async function createInitialState() {
    const password = process.env.DEMO_SEED_PASSWORD || 'CafeQ123!';
    if (process.env.DEMO_CATALOG === 'kmutt') {
      const { createCampusState } = await import('./campusSeed.js');
      return createCampusState(password);
    }
    return {
      cafes: (await listCafes()).map((cafe) => ({ ...cafe, ownerUserId: cafe.cafeId === 1 ? 202 : 203 })),
      menu: await listMenuItems({}),
      users: [
        { userId: 201, name: 'Somchai', email: 'customer@example.test', passwordHash: hashPassword(password), staffCafeIds: [] },
        { userId: 202, name: 'Cafe Rung Staff', email: 'staff-rung@example.test', passwordHash: hashPassword(password), staffCafeIds: [1] },
        { userId: 203, name: 'Food Court Staff', email: 'staff-foodcourt@example.test', passwordHash: hashPassword(password), staffCafeIds: [2] },
      ],
      sessions: [], favorites: [], orders: [], payments: [],
    };
}

// Serialize requests so checkout and menu updates see a consistent snapshot.
export function transact(action) {
  if (process.env.DATA_STORE === 'mysql') return transactMysql(action, createInitialState);
  const result = queue.then(async () => {
    const state = await read();
    const value = await action(state);
    await mkdir(dirname(resolve(file)), { recursive: true });
    await writeFile(file + '.tmp', JSON.stringify(state, null, 2));
    await rename(file + '.tmp', file);
    return value;
  });
  queue = result.catch(() => {});
  return result;
}
