# คู่มือส่งต่องาน Backend และ MySQL

## งานที่ส่งให้สมาชิกคนที่ 2

ใช้ [ข้อตกลง API](api-contract.md) เป็นสัญญาร่วมกับ Frontend และ [ข้อตกลง MySQL](database-contract.md) สำหรับตาราง ชื่อคอลัมน์ และรหัสข้อมูลทดสอบ

| งาน | API ที่สมาชิกคนที่ 2 รับผิดชอบ |
| --- | --- |
| บัญชี | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` |
| รายการโปรด | `GET /api/favorites`, `PUT /api/favorites/:menuItemId`, `DELETE /api/favorites/:menuItemId` |
| คำนวณยอดและจ่ายจำลอง | `POST /api/checkout/quote`, `POST /api/checkout/confirm` |
| ประวัติและรายละเอียดออเดอร์ | `GET /api/orders`, `GET /api/orders/:id` |
| คิวพนักงาน | `GET /api/staff/cafes/:cafeId/orders`, `PATCH /api/staff/cafes/:cafeId/orders/:id/status` |

สมาชิกคนที่ 1 ส่งตัวอย่างข้อมูลเมนูด้านล่างให้สมาชิกคนที่ 2 ใช้ทดสอบ checkout ได้ทันที พอ MySQL พร้อมแล้วให้ checkout อ่านราคาล่าสุดและสถานะเปิดขายจากตาราง `menu_items` ได้โดยตรง

```json
{"menuItemId":101,"cafeId":1,"name":"Iced Americano","price":5500,"isActive":true}
```

`5500` คือ 55 บาท Frontend ส่ง `cafeId` และรายการที่มี `menuItemId` กับ `quantity` ไปขอคำนวณยอด สมาชิกคนที่ 2 ส่งวิธีเรียก middleware ตรวจสิทธิ์ตามร้านให้สมาชิกคนที่ 1 ใช้ป้องกัน API จัดการเมนูของพนักงาน

## ต่อ MySQL ในเครื่อง

1. สมาชิกคนที่ 3 เตรียมฐานข้อมูล `kmutt_cafeq` และบัญชี MySQL สำหรับแอป แล้วรัน `database/schema.sql` ตามด้วย `database/seed.sql` เมื่อ SQL พร้อม ทั้งสองไฟล์ยังเป็นโครงในรีโปปัจจุบัน
2. สมาชิกที่ทำ Backend คัดลอก `backend/.env.example` เป็น `backend/.env` จากนั้นใส่ค่าของเครื่องตัวเอง เก็บรหัสผ่านจริงไว้ในไฟล์ `.env` ที่ Git ignore

```dotenv
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=cafeq
DB_PASSWORD=your_local_mysql_password
DB_NAME=kmutt_cafeq
```

3. ให้ repository ใช้ `pool` จาก `backend/src/config/database.js` ร่วมกัน ตัวอย่างใน `backend/src/repositories/menu.js`

```js
import { pool } from '../config/database.js';

export async function findMenuPrice(menuItemId) {
  const [rows] = await pool.execute(
    'SELECT id, cafe_id, price, is_active FROM menu_items WHERE id = ?',
    [menuItemId],
  );
  return rows[0] ?? null;
}
```

4. ตอนยืนยันจ่ายจำลอง ให้ใช้ connection เดียวจาก pool สำหรับ transaction ที่บันทึก `orders`, `order_items` และ `payments` ทำ rollback หากผิดพลาด และคืน connection ให้ pool ใน `finally`
5. เปิด Backend ด้วย `npm.cmd --prefix backend run dev` แล้วทดสอบ `GET /api/health` เพื่อเช็ก Express จากนั้นทดสอบ `GET /api/menu-items` เมื่อทำเสร็จ เพื่อยืนยันว่าอ่านเมนูจาก seed ได้จริง
