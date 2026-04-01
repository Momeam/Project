'use client'

import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuthStore, UserRole } from '@/stores/useAuthStore'; 
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  let allowedRoles: UserRole[] = ['USER', 'SELLER', 'ADMIN']; // ค่าเริ่มต้นให้เข้าได้ทุกคนที่ล็อกอิน
  if (pathname.startsWith('/admin')) {
    allowedRoles = ['ADMIN'];
  } else if (pathname.startsWith('/user/profile')) {
    allowedRoles = ['USER', 'SELLER', 'ADMIN'];
  } else if (pathname.startsWith('/user')) {
    allowedRoles = ['USER', 'SELLER'];
  } else if (pathname.startsWith('/create-property') || pathname.startsWith('/edit-property')) {
    allowedRoles = ['SELLER', 'ADMIN'];
  }

    return (
      <ProtectedRoute allowedRoles={allowedRoles}>
        <div className="pt-28 md:pt-32 min-h-screen">
          {children}
        </div>
      </ProtectedRoute>
    );
  }