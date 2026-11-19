# โครงสร้างตามสไลด์ Relation Table

ฐานข้อมูลเดโมเพิ่มตารางจริงที่ใช้ชื่อและฟิลด์ใกล้เคียงสไลด์ และซิงก์การเปลี่ยนแปลงใน transaction เดียวกับตารางเดิมเพื่อรองรับ API ปัจจุบัน

| ตาราง | ความหมาย |
| --- | --- |
| Customer | customer_id, name, email, password_hash, phone เก็บข้อมูลลูกค้าและเบอร์โทรที่เลือกกรอกได้ |
| Staff | staff_id, name, email, password_hash, role เก็บข้อมูลพนักงานและบทบาทเริ่มต้น staff |
| Menu | menu_id, name, category, price, available พร้อม cafe_id, description และ image_url |
| Order | order_id, customer_id, order_date, total_price, status พร้อมร้าน จุดรับ และค่าบรรจุภัณฑ์ |
| OrderDetail | detail_id, order_id, menu_id, quantity, price พร้อมชื่อสินค้า ณ เวลาสั่ง โดย price คือราคาต่อชิ้น |
| Queue | queue_id, order_id, queue_number, queue_date, status พร้อม cafe_id เลขคิวเริ่มใหม่ตามร้านและวันเวลาไทย |

ใช้ password_hash เพื่อเก็บรหัสผ่านที่ผ่านการ hash แล้ว เก็บเงินเป็นสตางค์ ตาราง users และ cafe_staff ยังใช้ระบุตัวบัญชีกลางและสิทธิ์ของร้าน บัญชีพนักงานมีแถว Customer ด้วยเพื่อรองรับการสั่งซื้อจากบัญชีเดียวกัน

ตารางเดิมยังอยู่เพื่อรองรับความสัมพันธ์ของ sessions, favorites และ payments โดยเขียนข้อมูลเดิมและข้อมูลตามสไลด์พร้อมกัน ตาราง Queue อัปเดตสถานะพร้อมออเดอร์ และการส่งคำยืนยันจ่ายซ้ำใช้เลขคิวเดิม

เปิด MySQL Workbench แล้ว Refresh All ใน schema kmutt_cafeq เลือกตารางชื่อใหญ่ทั้งหกเพื่อดูข้อมูลตามสไลด์ ชื่อ Order เป็นคำสงวนของ MySQL ให้ครอบด้วย backticks เมื่อเขียน SQL

รัน schema.sql แล้ว presentation.sql ตามลำดับ สคริปต์เปิดเซิร์ฟเวอร์จะทำให้โดยอัตโนมัติ ข้อมูลเดิมถูกคัดลอกด้วย INSERT IGNORE และมีไฟล์สำรองก่อนเปลี่ยนโครงสร้างใน .local/
