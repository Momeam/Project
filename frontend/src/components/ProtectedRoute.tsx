'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, UserRole } from '@/stores/useAuthStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[]; // รับค่าบทบาทที่อนุญาตให้เข้าได้
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  
  // ดึงข้อมูลผู้ใช้จาก Store
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const currentUser = useAuthStore((state) => state.currentUser);
  const userRole = currentUser?.role;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !userRole) return;

    // 1. ถ้ายังไม่ล็อกอิน -> ดีดไปหน้า Login
    if (!isLoggedIn) {
      router.replace('/login');
      return;
    }

    // 2. ถ้าล็อกอินแล้ว แต่ Role ไม่ตรงกับที่อนุญาต -> ดีดไปหน้าแรก (หรือหน้า Dashboard ของตัวเอง)
    if (!allowedRoles.includes(userRole)) {
      // Logic การดีดกลับตาม Role ที่เป็นอยู่
      if (userRole === 'ADMIN') {
         router.replace('/admin/users');
      } else if (userRole === 'SELLER') {
         router.replace('/user/dashboard');
      } else {
         router.replace('/');
      }
    }
  }, [isLoggedIn, userRole, allowedRoles, router, isMounted]);

  // ถ้ายังโหลดไม่เสร็จ หรือ สิทธิ์ไม่ผ่าน ไม่ต้องแสดงเนื้อหา
  if (!isMounted || !isLoggedIn || !userRole || !allowedRoles.includes(userRole)) {
    return null; // หรือใส่ Loading Spinner
  }

  // ถ้าผ่านทุกด่าน ให้แสดงเนื้อหา
  return <>{children}</>;
}