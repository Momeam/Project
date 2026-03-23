import os from 'os';
import type { NextConfig } from 'next';

// ⭐️ ฟังก์ชันเช็ก IP ปัจจุบันของเครื่องคอมพิวเตอร์ (เวอร์ชัน TypeScript)
function getLocalIPs(): string[] {
  const interfaces = os.networkInterfaces();
  const ips: string[] = [];
  
  if (interfaces) {
    for (const name of Object.keys(interfaces)) {
      const ifaceList = interfaces[name];
      if (ifaceList) {
        for (const iface of ifaceList) {
          // ดึงมาเฉพาะ IPv4 และข้าม localhost ไป
          if (iface.family === 'IPv4' && !iface.internal) {
            ips.push(iface.address);
          }
        }
      }
    }
  }
  return ips;
}

const nextConfig: NextConfig = {
  // @ts-ignore - ใส่ไว้กันเหนียว กรณีไฟล์ Type ของ Next.js อัปเดตตามฟีเจอร์ใหม่ไม่ทัน จะได้ไม่ขึ้นเส้นแดงครับ
  allowedDevOrigins: ['localhost', ...getLocalIPs()],
};

export default nextConfig;