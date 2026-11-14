# แผนทำงานร่วมกัน · KMUTT CafeQ

ทีมมี 3 คน เป้าหมายรุ่นส่งงานคือลูกค้าสั่งและจ่ายจำลองจากเครื่องหนึ่ง แล้วพนักงานเห็นออเดอร์และอัปเดตคิวจากอีกเครื่องได้

เริ่มจาก [ข้อตกลง API](api-contract.md) และ [ข้อตกลง MySQL](database-contract.md) ทั้งสองฉบับเป็นร่างสำหรับทีมยืนยันก่อนเชื่อมระบบ ขณะนี้หน้าเว็บยังใช้ข้อมูลเดโมในเบราว์เซอร์ และ Express เปิดใช้ `GET /api/health` แล้ว

## คนที่ 1 · Frontend และ API ร้านกับเมนู

| งาน | ไฟล์หลัก |
| --- | --- |
| อ่านร้าน ค้นหาและกรองเมนู เปิดรายละเอียด และเพิ่ม แก้ หรือปิดขายเมนูฝั่งพนักงาน | `backend/src/routes/{cafes,menu}.js`, `backend/src/controllers/{cafes,menu}.js` |
| อ่านและเขียนข้อมูลร้านกับเมนู เริ่มด้วยข้อมูลจำลอง แล้วต่อ MySQL | `backend/src/repositories/{cafes,menu}.js`, `backend/test/fixtures/menu.js`, `backend/test/menu.test.js` |
| ต่อหน้า Home, Cafes, Drink Details และ Favorites รวมถึงสถานะโหลด ข้อมูลว่าง และข้อผิดพลาด | `frontend/src/pages/HomePage.jsx`, `CatalogPages.jsx`, `frontend/src/data/MenuContext.jsx`, `frontend/src/services/{api,catalog,favorites}.js` |
| ต่อล็อกอินและเมนูพนักงาน แสดงเฉพาะร้านที่บัญชีมีสิทธิ์ | `frontend/src/pages/{AccessPages,StaffMenuPage}.jsx`, `frontend/src/App.jsx`, `frontend/src/services/auth.js` |
| ต่อการคำนวณยอดและจ่ายจำลอง ประวัติออเดอร์ และคิว ล้างเฉพาะตะกร้าร้านที่จ่ายสำเร็จ และดึงคิวซ้ำเป็นระยะ | `frontend/src/pages/{OrderPages,OnlinePaymentPage}.jsx`, `frontend/src/services/orders.js` |

เริ่มทำได้ด้วยข้อมูลตัวอย่างใน services สำหรับ API ที่ยังสร้างอยู่ และทดสอบร้านกับเมนูด้วย repository จำลอง ส่งชื่อ route ให้คนที่ 2 นำไปประกอบในเซิร์ฟเวอร์

## คนที่ 2 · Backend บัญชีและออเดอร์

| งาน | ไฟล์หลัก |
| --- | --- |
| สมัครลูกค้า ล็อกอิน ออกจากระบบ ดูบัญชีปัจจุบัน และตรวจสิทธิ์พนักงานตามร้าน | `backend/src/routes/auth.js`, `backend/src/controllers/auth.js`, `backend/src/repositories/users.js`, `backend/src/middleware/auth.js` |
| คำนวณยอดจากราคาในระบบ และสร้างออเดอร์หลังจ่ายจำลองสำเร็จ ใช้ transaction และป้องกันออเดอร์ซ้ำ | `backend/src/{routes,controllers,services}/checkout.js`, `backend/src/repositories/orders.js` |
| ประวัติลูกค้า คิวของร้าน และตรวจลำดับการเปลี่ยนสถานะ | `backend/src/{routes,controllers,services}/orders.js` |
| อ่าน เพิ่ม และลบรายการโปรดตามบัญชี | `backend/src/{routes,controllers,repositories}/favorites.js` |
| ประกอบ routes และ middleware จัดการเซสชันและข้อผิดพลาด ทดสอบ API | `backend/src/server.js`, `backend/src/config/database.js`, `backend/src/middleware/errorHandler.js`, `backend/test/{auth,checkout,orders,favorites}.test.js` |

เริ่มทำกฎราคา สิทธิ์ และสถานะด้วยข้อมูลจำลอง ใช้เมนูตัวอย่างจากข้อตกลง API และส่งรูปแบบ middleware ตรวจสิทธิ์ร้านให้คนที่ 1 ตั้งแต่ต้น

ดู [คู่มือส่งต่องาน Backend และ MySQL](backend-handoff.md) สำหรับรายการ API ของสมาชิกคนที่ 2 และขั้นตอนตั้งค่าฐานข้อมูลในเครื่อง

## คนที่ 3 · MySQL

| งาน | ไฟล์หลัก |
| --- | --- |
| สร้างตารางและความสัมพันธ์ ใส่ constraints และดัชนีสำหรับเมนู ประวัติ และคิว | `database/schema.sql` |
| เตรียมสองร้าน เมนูหลายหมวด บัญชีทดลอง และออเดอร์หลายสถานะ | `database/seed.sql` |
| เขียนคำสั่งตรวจการติดตั้งใหม่ การแยกคิวตามร้าน และการรักษายอดย้อนหลัง | `database/checks.sql` |
| บันทึกวิธีสร้างฐานข้อมูลและขั้นตอนรัน SQL ประสานค่าตัวอย่างกับคนที่ 2 | `database/README.md`, `backend/.env.example` |

เริ่มทดสอบด้วย MySQL โดยตรง ส่งชื่อคอลัมน์และรหัส seed ที่ตกลงแล้วให้ทั้งสองคนก่อน SQL ฉบับเต็ม

## วิธีรวมงาน

- แต่ละคนเปิด branch จาก `main` และทำ commit ตามงานย่อย เจ้าของ `server.js` คือคนที่ 2 เจ้าของ `database/` คือคนที่ 3 ส่วน Frontend และ API ร้านและเมนูเป็นของคนที่ 1
- เมื่อต้องแก้ฟิลด์ API หรือคอลัมน์ ให้ปรับเอกสารกลางพร้อมตัวอย่าง แล้วแจ้งคนที่เรียกใช้ก่อนรวมโค้ด
- เริ่มรวม **MySQL → API ร้านและเมนู → หน้า Cafes** แล้วต่อ **ล็อกอิน → checkout → คิว** ใช้การจ่ายจำลองและเก็บตะกร้าในเบราว์เซอร์ในรุ่นแรก
- ตรวจว่าลูกค้ากับพนักงานต่างเบราว์เซอร์เห็นออเดอร์เดียวกัน พนักงานร้านอื่นเข้าไม่ได้ กดจ่ายซ้ำสร้างออเดอร์เดียว แก้ราคาเมนูแล้วประวัติเดิมไม่เปลี่ยน และรีสตาร์ต Express แล้วออเดอร์ยังอยู่
- ทดสอบการติดตั้งใหม่ตาม [README](../README.md) แล้วรัน `npm.cmd --prefix frontend run build`
