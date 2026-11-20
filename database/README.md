# ฐานข้อมูล MySQL · KMUTT CafeQ

โฟลเดอร์นี้เก็บไฟล์ SQL ตาม [ข้อตกลง MySQL](../docs/database-contract.md) ใช้ MySQL 8.0 ขึ้นไป

| ไฟล์ | ทำอะไร |
| --- | --- |
| `schema.sql` | สร้างฐานข้อมูล `kmutt_cafeq` และตารางทั้ง 9 ตาราง รันซ้ำได้ (ลบตารางเดิมแล้วสร้างใหม่ ข้อมูลเดิมจะหาย) |
| `seed.sql` | ใส่ข้อมูลทดลอง สองร้าน เมนู 12 รายการ บัญชีทดลอง และออเดอร์ 4 สถานะ |
| `checks.sql` | คำสั่งตรวจว่าติดตั้งถูกต้อง ไม่แก้ข้อมูลจริง |

## ติดตั้งครั้งแรก

1. ติดตั้ง MySQL Server และ MySQL Workbench แล้วเชื่อมต่อด้วยบัญชี `root`
2. สร้างบัญชีสำหรับแอปและให้สิทธิ์ (ใส่รหัสผ่านของตัวเองแทน `<รหัสผ่าน>`):

```sql
CREATE DATABASE IF NOT EXISTS kmutt_cafeq CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'cafeq'@'localhost' IDENTIFIED BY '<รหัสผ่าน>';
GRANT ALL PRIVILEGES ON kmutt_cafeq.* TO 'cafeq'@'localhost';
```

3. รันไฟล์ตามลำดับนี้ ใน Workbench ใช้ File → Open SQL Script แล้วกด `Ctrl+Shift+Enter`:
   1. `schema.sql`
   2. `seed.sql`
   3. `checks.sql` (อ่านผลทีละช่อง ข้อความ EXPECT ใต้แต่ละหัวข้อบอกค่าที่ควรเห็น)

หรือใช้บรรทัดคำสั่ง:

```powershell
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
mysql -u root -p < database/checks.sql
```

## ตั้งค่า Backend

คัดลอก `backend/.env.example` เป็น `backend/.env` แล้วใส่ค่าของเครื่องตัวเอง (ไฟล์ `.env` ไม่ขึ้น Git):

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=cafeq
DB_PASSWORD=<รหัสผ่านที่ตั้งไว้>
DB_NAME=kmutt_cafeq
```

ถ้าตอนติดตั้ง MySQL ตั้งพอร์ตเป็นอย่างอื่น (เช่น 3307) ให้แก้ `DB_PORT` ให้ตรงกัน

## ข้อมูลทดลอง

| รหัส | รายการ |
| --- | --- |
| ร้าน 1 | Cafe Rung (จุดรับ: Cafe Rung pickup counter) |
| ร้าน 2 | Food Court (จุดรับ: Food Court pickup counter) |
| เมนู 101 | Iced Americano 55 บาท (เมนู 101 ถึง 110 เป็นของ Cafe Rung, 111 ถึง 112 ของ Food Court) |
| ผู้ใช้ 201 | ลูกค้า `customer@example.test` |
| ผู้ใช้ 202 | พนักงาน Cafe Rung `staff-rung@example.test` |
| ผู้ใช้ 203 | พนักงาน Food Court `staff-foodcourt@example.test` |
| ออเดอร์ 301 ถึง 304 | สถานะ Waiting, Preparing, Ready, Done ตามลำดับ (301 สั่ง Iced Americano 2 แก้ว รวม 115 บาท) |

**หมายเหตุ:** ค่า `password_hash` ของบัญชีทดลองใน `seed.sql` เป็นค่าตัวอย่างชั่วคราว ยังล็อกอินไม่ได้ จนกว่าทีม Backend จะเลือกวิธีเข้ารหัสรหัสผ่านและแทนค่าเหล่านี้ด้วย hash จริง

## กติกาของข้อมูล

- เงินเก็บเป็นจำนวนเต็มหน่วยสตางค์ (5500 คือ 55 บาท) เวลาเก็บเป็น UTC
- ปิดขายเมนูด้วย `is_active = 0` ห้ามลบแถว เพื่อรักษาประวัติออเดอร์
- `order_items` เก็บชื่อและราคา ณ เวลาสั่งไว้ แก้ราคาเมนูแล้วออเดอร์เก่าไม่เปลี่ยน
- ตอนเปลี่ยนสถานะออเดอร์ Backend ต้องตั้ง `orders.updated_at = UTC_TIMESTAMP()` เอง
- ค่าที่เสนอสำหรับ `payments` คือ `method = 'PromptPay demo'` และ `status = 'Succeeded'` ทีมต้องยืนยันให้ตรงกัน
- หมวดเมนูที่ใช้ได้: `Coffee`, `Tea & More`, `Snacks` สถานะออเดอร์: `Waiting`, `Preparing`, `Ready`, `Done`
