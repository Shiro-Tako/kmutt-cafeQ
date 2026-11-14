# ข้อตกลง MySQL · KMUTT CafeQ

ร่างสำหรับ Backend และ Database ใช้คุยกันก่อนเขียน SQL ดูรูปแบบ JSON และ routes ใน [API contract](api-contract.md) ตอนนี้ `database/schema.sql` และ `database/seed.sql` ยังเป็นไฟล์โครง

| ตาราง | คอลัมน์ที่ทั้งทีมต้องใช้ตรงกัน |
| --- | --- |
| `users` | `id`, `name`, `email` (unique), `password_hash` |
| `cafes` | `id`, `name`, `pickup_point` |
| `cafe_staff` | `user_id`, `cafe_id` ใช้คู่ค่านี้เป็นคีย์ |
| `sessions` | `token_hash` (คีย์), `user_id`, `expires_at` ลบเซสชันเมื่อออกจากระบบ |
| `menu_items` | `id`, `cafe_id`, `name`, `category`, `description`, `price`, `image_url` (nullable), `is_active` |
| `favorites` | `user_id`, `menu_item_id` ใช้คู่ค่านี้เป็นคีย์ |
| `orders` | `id`, `user_id`, `cafe_id`, `pickup_point`, `status`, `subtotal`, `packaging_fee`, `total`, `created_at`, `updated_at` |
| `order_items` | `order_id`, `menu_item_id`, `name`, `unit_price`, `quantity` ใช้คู่ `order_id` และ `menu_item_id` เป็นคีย์ |
| `payments` | `id`, `order_id` (unique), `user_id`, `confirmation_id`, `request_fingerprint`, `amount`, `method`, `status`, `confirmed_at` กำหนด unique ที่ `(user_id, confirmation_id)` |

- ใช้ ID จำนวนเต็มและเงินจำนวนเต็มหน่วยสตางค์ ตั้ง foreign keys สำหรับ ID ที่อ้างถึงตารางอื่น กำหนดช่วงราคาตั้งแต่ 0 ขึ้นไปและจำนวนสินค้ามากกว่า 0
- เก็บเวลาฐานข้อมูลเป็น UTC หมวดในรุ่นแรกใช้ `Coffee`, `Tea & More`, `Snacks` สถานะออเดอร์ใช้ `Waiting`, `Preparing`, `Ready`, `Done`
- ปิดขายด้วย `is_active = false` เพื่อรักษาประวัติ เก็บชื่อ ราคา และจุดรับ ณ เวลาสั่งไว้ในออเดอร์ ยอดเก่าต้องอยู่เท่าเดิมเมื่อราคาเมนูเปลี่ยน
- เพิ่มดัชนีสำหรับเมนูตาม `(cafe_id, is_active, category)`, ประวัติตาม `(user_id, created_at)` และคิวตาม `(cafe_id, status, created_at)`
- ใช้รหัส seed ให้ตรงกับ mock อย่างน้อย Cafe Rung `1`, Food Court `2`, Iced Americano `101`, พนักงาน Cafe Rung `202` และออเดอร์ตัวอย่าง `301` ใส่บัญชีพนักงานอีกหนึ่งร้านเพื่อทดสอบสิทธิ์ข้ามร้าน
- เมื่อ SQL พร้อม ให้รัน `schema.sql → seed.sql → checks.sql` บนฐานข้อมูลทดสอบใหม่ เก็บคำสั่งติดตั้งและบัญชีทดลองใน `database/README.md` ใช้เฉพาะข้อมูลเดโมและรหัสผ่านแบบ hash ใน seed
