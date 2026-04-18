/**
 * src/lib/api-config.ts
 * ==========================================
 * 🌐 Centralized API Configuration
 * แก้ปัญหา Hardcoded URL: ใช้ไฟล์นี้แทนการพิมพ์ localhost:5000 ซ้ำๆ ทุกที่
 * ตอน Deploy จริง แค่ตั้งค่า NEXT_PUBLIC_API_URL ใน .env.local แค่จุดเดียว
 * ==========================================
 */

/** Base URL ของ Backend API (fallback = localhost:5000 สำหรับ local dev) */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/** URL prefix สำหรับไฟล์ที่ upload ขึ้นไปเก็บใน backend */
export const UPLOADS_URL = `${API_BASE_URL}/uploads`;

/**
 * แปลง path รูปภาพที่ได้จาก backend ให้เป็น URL เต็มที่ใช้งานได้
 *
 * @param path - path ที่ได้จาก DB เช่น "1234567890-image.jpg" หรือ URL เต็ม
 * @param fallback - รูป fallback เมื่อไม่มีรูป (default: '/placeholder.jpg')
 * @returns URL รูปภาพที่พร้อมใช้ใน <img> หรือ <Image>
 *
 * @example
 * getImageUrl("1234567890-image.jpg")
 * // → "http://localhost:5000/uploads/1234567890-image.jpg"
 *
 * getImageUrl("https://example.com/photo.jpg")
 * // → "https://example.com/photo.jpg"  (ไม่เปลี่ยนแปลง)
 *
 * getImageUrl(null)
 * // → "/placeholder.jpg"
 */
export function getImageUrl(
  path: string | null | undefined,
  fallback = '/placeholder.jpg'
): string {
  if (!path) return fallback;
  // ถ้าเป็น URL เต็มอยู่แล้ว (http/https/data:) ให้คืนค่าตรงๆ
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  // ถ้าเป็น path ที่ขึ้นต้นด้วย /uploads/ แค่ต่อ base URL
  if (path.startsWith('/uploads/')) return `${API_BASE_URL}${path}`;
  // ถ้าเป็นชื่อไฟล์ล้วนๆ ให้ต่อ uploads path
  return `${UPLOADS_URL}/${path}`;
}
