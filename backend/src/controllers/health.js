// ตอบว่า API ยังทำงานอยู่โดยไม่ต้องต่อฐานข้อมูล
export function getHealth(_request, response) {
  response.status(200).json({ status: 'ok' });
}
