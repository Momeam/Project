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
  
  let allowedRoles: UserRole[] = [];
  if (pathname.startsWith('/admin')) {
    allowedRoles = ['ADMIN'];
  } else if (pathname.startsWith('/user/profile')) {
    allowedRoles = ['USER', 'SELLER', 'ADMIN']; // (Req 5)
  } else if (pathname.startsWith('/user')) {
    allowedRoles = ['USER', 'SELLER'];
  }

  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      {children}
    </ProtectedRoute>
  );
}