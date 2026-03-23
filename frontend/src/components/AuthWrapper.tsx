'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
    const [isMounted, setIsMounted] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    // ⭐️⭐️ แก้ไขจุดนี้: ดึง State แยกกันเพื่อป้องกัน Infinite Loop (getSnapshot error) ⭐️⭐️
    // การดึงแบบ Object { ... } จะทำให้ React คิดว่าเป็นค่าใหม่ตลอดเวลา
    const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
    const role = useAuthStore((state) => state.role);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted) return;

        // ถ้าอยู่ในหน้า Login/Register ไม่ต้องทำอะไร (ปล่อยให้หน้า Login จัดการเอง)
        if (pathname === '/login' || pathname === '/register') {
             // แต่ถ้า Login แล้วดันมาหน้า Login -> ดีดไป Dashboard
             if (isLoggedIn) {
                 if (role === 'ADMIN') router.replace('/admin/users');
                 else router.replace('/user/dashboard');
             }
             return;
        }

        // ถ้าไม่ได้ Login และไม่ได้อยู่หน้าสาธารณะ -> ดีดไป Login
        if (!isLoggedIn && pathname !== '/') {
             router.replace('/login');
        }
        
    }, [isMounted, isLoggedIn, role, pathname, router]);

    // แสดงผล
    return <>{children}</>;
}