# เปิด CafeQ จากแล็ปท็อป

โครงสร้างตามสไลด์อยู่ใน [presentation-schema.md](presentation-schema.md) ตาราง Customer, Staff, Menu, Order, OrderDetail และ Queue ซิงก์กับระบบเดิมใน transaction เดียว

บน branch demo-version ใช้ MySQL Server ที่ติดตั้งในเครื่อง และแยกข้อมูลของแอปไว้ที่ `.local/mysql` พอร์ต 3307 หน้าเว็บและ API เปิดที่พอร์ต 3000 ข้อมูลจริงและรหัสผ่านอยู่ใน `.local/` ซึ่ง Git ignore ไว้

จากรากโปรเจกต์ เปิด PowerShell แล้วรัน

```powershell
powershell -ExecutionPolicy Bypass -File scripts/start-laptop.ps1
```

เปิด http://127.0.0.1:3000 บัญชีทดลองคือ customer@example.test, staff-rung@example.test และ staff-foodcourt@example.test ใช้รหัสผ่านจากช่อง `accountPassword` ใน `.local/server.json` สมัครลูกค้าใหม่ผ่านหน้าเว็บได้

## เปิดออนไลน์

วาง cloudflared.exe ของ Cloudflare ใน `.local/cloudflared.exe` แล้วใช้

```powershell
powershell -ExecutionPolicy Bypass -File scripts/start-laptop.ps1 --online
```

ส่ง URL https://…trycloudflare.com ที่แสดงในเทอร์มินัลให้เพื่อน เปิด URL นี้ทั้งฝั่งลูกค้าและพนักงาน เมื่อกด Ctrl+C โปรแกรมจะหยุด tunnel, API และ MySQL URL จะเปลี่ยนเมื่อเริ่มใหม่ และแล็ปท็อปต้องเปิดพร้อมเชื่อมอินเทอร์เน็ตตลอดช่วงใช้งาน

หยุดจาก PowerShell อีกหน้าต่างได้ด้วย `powershell -ExecutionPolicy Bypass -File scripts/stop-laptop.ps1`

โหมดออนไลน์ตั้ง cookie แบบ Secure จึงให้ล็อกอินผ่าน URL HTTPS ของ tunnel ขณะใช้โหมดนี้

## ดูข้อมูลด้วย MySQL Workbench

สร้าง connection ไปที่ 127.0.0.1 พอร์ต 3307 ใช้ user cafeq และรหัสผ่านจาก `dbPassword` ใน `.local/server.json` เลือก schema kmutt_cafeq จะมีตาราง users, cafes, menu_items, orders, order_items, payments และตารางประกอบ เปิดเซิร์ฟเวอร์ไว้ขณะเชื่อม Workbench

สำรองข้อมูลผ่าน Workbench Data Export ขณะเซิร์ฟเวอร์ทำงาน หรือคัดลอกโฟลเดอร์ `.local/mysql` ทั้งชุดหลังหยุด MySQL แล้ว เก็บไฟล์สำรองในที่ส่วนตัว

โปรแกรมใช้ MySQL Server ที่ C:/Program Files/MySQL/MySQL Server 26.7/bin/mysqld.exe เปลี่ยนได้ด้วย environment variable MYSQLD_PATH รุ่นนี้ใช้ transaction และ coordinator row สำหรับข้อมูลเดโมขนาดเล็ก การจ่ายเงินยังเป็นการจำลอง
