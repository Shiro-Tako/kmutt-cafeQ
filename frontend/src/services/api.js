// จุดกลางที่หน้าเว็บใช้ส่งคำขอไปยัง /api และอ่านผลเป็น JSON
export async function requestJson(path, { method = 'GET', body, signal } = {}) {
  const response = await fetch(`/api${path}`, {
    method,
    signal,
    ...(body === undefined ? {} : {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  });
  // 204 คือสำเร็จแบบไม่มีข้อมูล ส่วนข้อผิดพลาดส่งข้อความกลับไปให้หน้าเว็บแสดง
  if (response.status === 204) return;
  const data = await response.json().catch(() => null);
  if (!response.ok || data === null) {
    throw Object.assign(new Error(data?.error?.message ?? `Request failed (${response.status})`), {
      status: response.status,
      code: data?.error?.code,
    });
  }
  return data;
}
