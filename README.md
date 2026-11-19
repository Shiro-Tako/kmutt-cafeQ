# KMUTT Café Queue System — Demo

Branch `demo-version` เป็นเดโมแยกจาก `main` สำหรับระบบลูกค้าและพนักงาน: สมัคร/ล็อกอิน ดูร้านและเมนู ตะกร้า จ่ายเงินจำลอง สร้างออเดอร์และคิว จัดการเมนูและสถานะออเดอร์ของร้าน การจ่ายเงินไม่มีการเรียกเก็บเงินจริง

## ติดตั้งบน Windows

ติดตั้ง Git, Node.js 24 พร้อม npm แล้วเปิด PowerShell:

```powershell
git clone --branch demo-version https://github.com/Shiro-Tako/kmutt-cafeQ.git
cd kmutt-cafeQ
npm.cmd --prefix frontend ci
npm.cmd --prefix backend ci
```

ถ้ามี repo แล้ว ให้บันทึกงานของตัวเองก่อนเปลี่ยน branch แล้วใช้ `git fetch origin` และ `git switch demo-version`

## เปิดเว็บและฐานข้อมูลบนแล็ปท็อป

ติดตั้ง MySQL Server (Workbench เป็นตัวเลือกสำหรับดูตาราง) ค่าเริ่มต้นของ launcher คือ `C:/Program Files/MySQL/MySQL Server 26.7/bin/mysqld.exe` ถ้าติดตั้งคนละ path ให้ตั้งใน PowerShell เดียวกันก่อนเริ่ม เช่น:

```powershell
$env:MYSQLD_PATH = 'C:/Program Files/MySQL/MySQL Server 8.4/bin/mysqld.exe'
Test-Path $env:MYSQLD_PATH
```

แก้ path ให้ตรงไฟล์จริง ต้องได้ `True` จากนั้นเปิดเซิร์ฟเวอร์จากรากโปรเจกต์:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/start-laptop.ps1
```

เปิด http://127.0.0.1:3000 ตัว launcher build หน้าเว็บ เริ่ม MySQL instance แยก สร้างตาราง/ข้อมูลเริ่มต้น แล้วเปิด Express เสิร์ฟเว็บและ API ไม่ต้อง import SQL หรือสร้าง `.env` เองสำหรับโหมดนี้

## เปิดออนไลน์ให้มือถือและเพื่อนทดสอบ

ติดตั้ง Tailscale เปิดแอปแล้วล็อกอิน ตั้งชื่อเครื่องด้วยคำสั่งต่อไปนี้ใน PowerShell แบบ Administrator:

```powershell
& 'C:/Program Files/Tailscale/tailscale.exe' set --hostname=kmutt-cafeq
```

หากเปิดเซิร์ฟเวอร์เดิมอยู่ ให้หยุดก่อน แล้วเริ่มแบบออนไลน์:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/start-laptop.ps1 --tailscale
```

ครั้งแรกเปิดลิงก์อนุญาต Funnel ที่เทอร์มินัลแสดง แล้วอนุญาตด้วยบัญชี Tailscale ของคุณ ใช้ URL HTTPS ที่แสดงในเทอร์มินัล เครื่องเดโมปัจจุบันใช้ https://kmutt-cafeq.tail1917ea.ts.net เครื่องอื่นจะได้ URL ของตัวเอง ผู้เข้าชมเปิดจากเบราว์เซอร์มือถือได้โดยไม่ต้องติดตั้ง Tailscale

แล็ปท็อปต้องเปิด เชื่อมอินเทอร์เน็ต และไม่ sleep ระหว่างให้บริการ โหมดออนไลน์ให้ล็อกอินผ่าน HTTPS เพราะใช้ Secure cookie

หยุดด้วย Ctrl+C ในเทอร์มินัลเซิร์ฟเวอร์ หรือรันอีกหน้าต่าง:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/stop-laptop.ps1
```

อย่าเปิด launcher ซ้ำ หากขึ้น `A server already uses the CafeQ ports` ให้หยุดเซิร์ฟเวอร์เดิมก่อนแล้วรอให้หยุด ถ้าพอร์ตถูกใช้โดยโปรแกรมอื่น ให้ตรวจชื่อโปรแกรมก่อนตัดสินใจหยุด

## บัญชีและฐานข้อมูล

บัญชีเดโม: `customer@example.test`, `staff-rung@example.test`, `staff-foodcourt@example.test` ในโหมด laptop ใช้รหัสจาก `accountPassword` ใน `.local/server.json` ซึ่งสร้างแยกให้แต่ละเครื่อง ลูกค้าสมัครใหม่ผ่านเว็บได้ พนักงานเลือก **Switch to store side** ก่อนล็อกอิน

MySQL เก็บข้อมูลใน `.local/mysql` ใช้พอร์ต `3307` ฐานข้อมูล `kmutt_cafeq` ส่วนเว็บ/API ใช้พอร์ต `3000` ข้อมูลจริงและรหัสผ่านไม่ถูกส่งขึ้น GitHub เครื่องที่ clone ใหม่จะเริ่มด้วยข้อมูลเดโมของตัวเอง

Workbench เชื่อม `127.0.0.1:3307` user `cafeq` รหัสจาก `dbPassword` ใน `.local/server.json` ต้องเปิด launcher ไว้ระหว่างเชื่อม อย่าเปิดพอร์ต MySQL สู่สาธารณะ

ดูวิธีสำรองข้อมูลและรายละเอียดใน [คู่มือ laptop server](docs/laptop-server.md) ถ้าฐานข้อมูลเปิดไม่ได้ ดู `.local/mysql.log` อย่าลบ data folder เพื่อแก้ปัญหา

## ตรวจสอบการทำงาน

```powershell
npm.cmd --prefix frontend run build
node --test backend/test/demo.test.js
```

เมื่อเซิร์ฟเวอร์เปิดอยู่:

```powershell
Invoke-RestMethod http://127.0.0.1:3000/api/health
Invoke-RestMethod http://127.0.0.1:3000/api/cafes
```

Health ต้องได้ `status: ok` ส่วน cafes ต้องได้รายการร้าน Health อย่างเดียวไม่ได้ยืนยันการทำงานของฐานข้อมูล

ทดสอบมือถือด้วยเน็ตมือถือ เปิด URL HTTPS สมัคร/ล็อกอิน เพิ่มตะกร้าและจ่ายจำลอง เปิด browser อีก profile เป็นพนักงานร้านเดียวกัน ตรวจออเดอร์ใหม่และเปลี่ยนสถานะ จากนั้นตรวจข้อมูลใน Workbench และลอง restart เพื่อยืนยันว่าข้อมูลยังอยู่

## โครงสร้างและเอกสารทีม

| Folder | หน้าที่ |
| --- | --- |
| `frontend/` | React, Vite, JavaScript, Tailwind CSS v4, React Router |
| `backend/` | Express API, บัญชี สิทธิ์ร้าน เมนู ออเดอร์ คิว และ persistence |
| `database/` | SQL schema, migration ตาม presentation และ seed |
| `scripts/` | เปิด/ปิดเว็บ API MySQL และ tunnel บนแล็ปท็อป |
| `docs/` | คู่มือติดตั้ง ทดสอบ API ฐานข้อมูล และแบ่งงาน |

Browser → `/api` → Express → MySQL ในโหมด laptop หรือ JSON ในโหมดพัฒนา Backend ตรวจสิทธิ์ คำนวณยอด และสร้างออเดอร์หลังจ่ายจำลองสำเร็จ

- [พัฒนาด้วย Vite + Express + JSON โดยไม่ต้องติดตั้ง MySQL](docs/demo-version.md)
- [เปิดเซิร์ฟเวอร์ MySQL และ tunnel](docs/laptop-server.md)
- [โครงสร้างฐานข้อมูลตาม presentation](docs/presentation-schema.md)
- [แบ่งงานทีม](docs/team-plan.md)
- [API contract](docs/api-contract.md), [database contract](docs/database-contract.md), [backend handoff](docs/backend-handoff.md): ข้อตกลงประสานงานทีม ควรตรวจเทียบกับเดโมก่อนเชื่อม branch ของสมาชิก
