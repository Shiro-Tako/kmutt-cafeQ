import { createHash, randomUUID } from 'node:crypto';
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const maxPhotoBytes = 300 * 1024;
const prefix = 'data:image/jpeg;base64,';
const defaultDirectory = fileURLToPath(new URL('../../data/', import.meta.url));
const directory = process.env.DEMO_DATA_FILE ? dirname(resolve(process.env.DEMO_DATA_FILE)) : defaultDirectory;
export const menuPhotoDirectory = join(directory, 'menu-photos');

// ตรวจรูปแบบและขนาดของข้อมูล JPEG ที่ส่งมาจากหน้าเว็บ
export function decodeMenuPhoto(photo) {
  if (typeof photo !== 'string' || !photo.startsWith(prefix) ||
      photo.length > prefix.length + Math.ceil(maxPhotoBytes / 3) * 4) return null;
  const encoded = photo.slice(prefix.length);
  const bytes = Buffer.from(encoded, 'base64');
  return bytes.length >= 5 && bytes.length <= maxPhotoBytes &&
    bytes.toString('base64') === encoded &&
    bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff &&
    bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9 ? bytes : null;
}

// ใช้แฮชของรูปเป็นชื่อไฟล์ รูปที่เหมือนกันจึงใช้ URL เดียวกัน
export async function saveMenuPhoto(bytes) {
  const filename = createHash('sha256').update(bytes).digest('hex') + '.jpg';
  const destination = join(menuPhotoDirectory, filename);
  const temporary = join(menuPhotoDirectory, randomUUID() + '.tmp');
  await mkdir(menuPhotoDirectory, { recursive: true });
  try {
    await writeFile(temporary, bytes, { flag: 'wx' });
    await rename(temporary, destination);
  } finally {
    await rm(temporary, { force: true });
  }
  return '/api/menu-photos/' + filename;
}
