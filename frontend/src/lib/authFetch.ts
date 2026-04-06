/**
 * authFetch — wrapper ของ fetch ที่จัดการ JWT expired อัตโนมัติ
 * 
 * ถ้า response เป็น 401 (Token หมดอายุ / ไม่ถูกต้อง) จะ:
 * 1. เคลียร์ token ออกจาก localStorage และ zustand store
 * 2. redirect ไปหน้า login
 * 3. ไม่ส่ง request ซ้ำอีก (ป้องกัน spam log บน backend)
 */

import { useAuthStore } from '@/stores/useAuthStore';

let isLoggingOut = false; // ป้องกันการ logout ซ้ำหลายครั้งพร้อมกัน

export function getAuthHeaders(): Record<string, string> {
    const token = useAuthStore.getState().token || localStorage.getItem('token');
    if (!token) return {};
    return { 'Authorization': `Bearer ${token}` };
}

export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    // ถ้ากำลัง logout อยู่แล้ว ไม่ต้องส่ง request ซ้ำ
    if (isLoggingOut) {
        return new Response(JSON.stringify({ error: 'Session expired' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const response = await fetch(input, init);

    if (response.status === 401) {
        // ถ้ายังไม่ได้ logout ให้ทำครั้งเดียว
        if (!isLoggingOut) {
            isLoggingOut = true;
            console.warn('authFetch: Token expired or invalid — logging out...');

            // เคลียร์ทุกอย่าง
            useAuthStore.getState().logout();

            // redirect ไปหน้า login
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }

            // รีเซ็ต flag หลัง redirect (ป้องกัน lock ค้าง)
            setTimeout(() => {
                isLoggingOut = false;
            }, 3000);
        }
    }

    return response;
}
