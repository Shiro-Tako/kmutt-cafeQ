# ข้อตกลง API · KMUTT CafeQ

ข้อตกลงยังเป็นร่างสำหรับทีมยืนยัน `GET /api/health` และ API อ่านร้านและเมนูเปิดใช้แล้วบน branch `frontend-catalog` โดยใช้ข้อมูลจำลองเป็นค่าเริ่มต้น Frontend เรียก URL แบบ `/api/...` ผ่าน Vite proxy ดูวิธีเปิดโหมด MySQL และเชื่อมสิทธิ์พนักงานใน [คู่มือ Backend](backend-handoff.md)

## รูปแบบร่วม

- API ใช้ JSON, ชื่อฟิลด์แบบ camelCase และ ID เป็นจำนวนเต็มบวก ราคาทั้งหมดเป็นจำนวนเต็มหน่วยสตางค์ เช่น `5500` คือ 55 บาท
- รายการใช้ `{"items":[]}` และข้อมูลรายการเดียวส่ง object โดยตรง ค่าเวลาส่งเป็น ISO 8601 ใน UTC
- ใช้เซสชันจาก cookie แบบ HttpOnly บน origin เดียวกัน Middleware ของคนที่ 2 ตรวจบัญชีและสิทธิ์ตาม `cafeId` ก่อนเข้าถึง API พนักงาน บัญชีพนักงานสำหรับรุ่นแรกมาจาก seed
- หนึ่งออเดอร์ต่อหนึ่งร้าน ลำดับสถานะคือ `Waiting → Preparing → Ready → Done`

## Routes

| Method และ URL | สิทธิ์ | ข้อมูลและผลลัพธ์ |
| --- | --- | --- |
| `GET /api/health` | ทุกคน | `200 {"status":"ok"}` เช็ก Express ได้โดยไม่ต้องเปิด MySQL |
| `GET /api/cafes` | ทุกคน | รายการร้าน มี `cafeId`, `name`, `pickupPoint` |
| `GET /api/menu-items` | ทุกคน | กรองเมนูเปิดขายด้วย `cafeId`, `category`, `q` ซึ่งเลือกส่งได้ |
| `GET /api/menu-items/:id` | ทุกคน | รายละเอียดเมนูเปิดขาย ถ้าปิดขายตอบ `404` |
| `POST /api/staff/cafes/:cafeId/menu-items` | พนักงานของร้าน | รับ `name`, `category`, `description`, `price`, `imageUrl` และคืนเมนูใหม่ `201` |
| `PATCH /api/staff/cafes/:cafeId/menu-items/:id` | พนักงานของร้าน | รับเฉพาะฟิลด์ที่แก้ คืนเมนูล่าสุด |
| `DELETE /api/staff/cafes/:cafeId/menu-items/:id` | พนักงานของร้าน | ปิดขายเมนู คืน `204` |
| `POST /api/auth/register` | ทุกคน | รับ `name`, `email`, `password` สร้างบัญชีลูกค้าและเริ่มเซสชัน คืนผู้ใช้ `201` |
| `POST /api/auth/login` | ทุกคน | รับ `email`, `password` เริ่มเซสชันและคืนผู้ใช้ |
| `GET /api/auth/me` | ผู้ใช้ที่ล็อกอิน | คืนผู้ใช้และร้านที่มีสิทธิ์ |
| `POST /api/auth/logout` | ผู้ใช้ที่ล็อกอิน | ยกเลิกเซสชัน คืน `204` |
| `GET /api/favorites` | ลูกค้า | คืนรายการเมนูโปรดที่ยังเปิดขาย |
| `PUT /api/favorites/:menuItemId` / `DELETE /api/favorites/:menuItemId` | ลูกค้า | เพิ่มหรือลบรายการโปรด คืน `204` |
| `POST /api/checkout/quote` | ลูกค้า | รับร้านและรายการจากตะกร้า คืนยอดที่เซิร์ฟเวอร์คำนวณ |
| `POST /api/checkout/confirm` | ลูกค้า | รับตะกร้าเดิมพร้อม `expectedTotal` และ `confirmationId` คืนออเดอร์ `201` หรือ `200` เมื่อส่งคำขอเดิมซ้ำ |
| `GET /api/orders` / `GET /api/orders/:id` | เจ้าของออเดอร์ | คืนรายการออเดอร์หรือรายละเอียดของลูกค้าคนนั้น |
| `GET /api/staff/cafes/:cafeId/orders` | พนักงานของร้าน | คืนคิวของร้าน กรองด้วย `status` ได้ |
| `PATCH /api/staff/cafes/:cafeId/orders/:id/status` | พนักงานของร้าน | รับ `{"status":"Preparing"}` และคืนออเดอร์หลังเปลี่ยนสถานะ |

## JSON สำหรับทำ mock

เมนูจาก Cafe Rung

```json
{"menuItemId":101,"cafeId":1,"name":"Iced Americano","category":"Coffee","description":"Double espresso and water, served cold","price":5500,"imageUrl":null,"isActive":true}
```

ผู้ใช้หลังล็อกอิน ลูกค้าจะได้ `staffCafeIds: []`

```json
{"userId":202,"name":"Staff Demo","email":"staff-rung@example.test","staffCafeIds":[1]}
```

คำขอคำนวณยอด และผลลัพธ์ตัวอย่างเมื่อสั่งสองแก้ว

```json
{"cafeId":1,"items":[{"menuItemId":101,"quantity":2}]}
```

```json
{"cafeId":1,"items":[{"menuItemId":101,"name":"Iced Americano","unitPrice":5500,"quantity":2}],"subtotal":11000,"packagingFee":500,"total":11500}
```

ออเดอร์หลังยืนยันจ่ายจำลอง

```json
{"orderId":301,"cafeId":1,"pickupPoint":"Cafe Rung pickup counter","status":"Waiting","subtotal":11000,"packagingFee":500,"total":11500,"createdAt":"2026-11-14T09:30:00Z","items":[{"menuItemId":101,"name":"Iced Americano","unitPrice":5500,"quantity":2}]}
```

## กติกา Checkout และข้อผิดพลาด

- ตรวจจำนวนเป็นจำนวนเต็มบวก รวมรายการ ID ซ้ำก่อนคำนวณ ตรวจว่าสินค้าทุกชิ้นเปิดขายและอยู่ร้านเดียวกัน ราคาและค่าบรรจุภัณฑ์มาจากระบบ ฝั่งลูกค้าส่งยอดเดิมใน `expectedTotal` เพื่อให้เซิร์ฟเวอร์ตรวจว่าราคาเปลี่ยนหรือไม่
- `confirmationId` เป็น UUID ที่ Frontend สร้างหนึ่งครั้งต่อการยืนยันหนึ่งรายการและใช้ค่าเดิมเมื่อส่งซ้ำ Backend ผูกกับบัญชีและคำขอเดิม ถ้าเปลี่ยนข้อมูลแล้วใช้ ID เดิมตอบ `409` เมื่อยืนยันสำเร็จให้บันทึกออเดอร์ รายการสินค้า และการจ่ายจำลองใน transaction เดียว
- ข้อผิดพลาดใช้ `{"error":{"code":"PRICE_CHANGED","message":"Review the updated total."}}` เมื่อยอดเปลี่ยนให้ Frontend เรียก quote ใหม่แล้วให้ลูกค้ายืนยันอีกครั้ง
- `400` ข้อมูลไม่ครบหรือไม่ถูกต้อง, `401` ยังไม่ล็อกอิน, `403` ไม่มีสิทธิ์ร้าน, `404` หาไม่พบหรือออเดอร์ไม่ใช่ของผู้ใช้, `409` ข้อมูลขัดกัน เช่น `PRICE_CHANGED`, `ITEM_UNAVAILABLE`, `INVALID_STATUS_TRANSITION`, `CONFIRMATION_CONFLICT`, `503` ฐานข้อมูลใช้งานไม่ได้
