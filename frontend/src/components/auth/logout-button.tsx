// src/components/auth/logout-button.tsx
'use client'

import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = () => {
    // ลบข้อมูลสถานะจาก Local Storage
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    // Redirect ไปหน้า Login
    router.replace('/login');
  }

  return (
    <Button variant="ghost" onClick={handleLogout} className="flex items-center space-x-2">
        <LogOut className="h-4 w-4" />
        <span>Logout</span>
    </Button>
  )
}