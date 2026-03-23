'use client' 
// (จำเป็นต้องเป็น 'use client' เพราะมีปุ่มที่คลิกได้ และใช้ Link)

import { Bell, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function AppHeader() {
  return (
    <header className="bg-white dark:bg-gray-900 border-b shadow-sm sticky top-0 z-50">
      <nav className="container mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
        
        {/* ส่วนที่ 1: โลโก้ หรือ ชื่อเว็บ (ฝั่งซ้าย) */}
        <Button variant="link" asChild className="text-xl font-bold p-0 text-gray-900 dark:text-white">
          <Link href="/">
            My Web App
          </Link>
        </Button>

        {/* ส่วนที่ 2: ปุ่ม actions (ฝั่งขวา) */}
        <div className="flex items-center space-x-2">
          
          {/* 🟢 นี่คือปุ่มแจ้งเตือนที่คุณต้องการ */}
          <Button 
            variant="ghost" // 'ghost' (ไม่มีพื้นหลัง) หรือ 'outline' (มีเส้นขอบ)
            size="icon"
            onClick={() => alert('แสดงการแจ้งเตือน!')}
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </Button>

          {/* 🟢 นี่คือปุ่มเข้าสู่ระบบที่อยู่ข้างๆ */}
          <Button asChild>
            <Link href="/login">
              <LogIn className="h-4 w-4 mr-2" />
              เข้าสู่ระบบ
            </Link>
          </Button>
          
        </div>
      </nav>
    </header>
  )
}