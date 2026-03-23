'use client'

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // 👈 (ต้องติดตั้งก่อน)
import { Bell, Trash2, CheckCheck } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';

export function NotificationBell() {
  // 1. 🟢 ป้องกัน Hydration Error
  const [isMounted, setIsMounted] = useState(false);

  // 2. 🟢 ดึงข้อมูลผู้ใช้ที่ล็อกอินอยู่
  const currentUserEmail = useAuthStore((state) => state.email);

  // 3. 🟢 ดึง State และ Actions จาก "กล่องจดหมาย"
  const notifications = useNotificationStore((state) => state.notifications);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const deleteNotification = useNotificationStore((state) => state.deleteNotification);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !currentUserEmail) {
    // 4. 🟢 ถ้ายังไม่ Mount หรือยังไม่ล็อกอิน ให้แสดงปุ่ม 🔔 ธรรมดา
    return (
      <Button 
        variant="ghost" 
        size="icon"
        aria-label="Notifications"
        className="text-gray-700 dark:text-gray-300"
      >
        <Bell className="h-5 w-5" />
      </Button>
    );
  }

  // 5. 🟢 กรองการแจ้งเตือนเฉพาะของฉัน
  const myNotifications = notifications
    .filter(n => n.recipientEmail === currentUserEmail)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // (เรียงใหม่ไปเก่า)

  // 6. 🟢 นับข้อความที่ยังไม่อ่าน
  const unreadCount = myNotifications.filter(n => !n.read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          aria-label="Notifications"
          className="text-gray-700 dark:text-gray-300 relative" // 👈 เพิ่ม relative
        >
          <Bell className="h-5 w-5" />
          
          {/* 7. 🟢 แสดง "จุดสีแดง" 🔴 */}
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      
      {/* 8. 🟢 เนื้อหา Dropdown */}
      <PopoverContent className="w-80 dark:bg-gray-800" align="end">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium text-lg">การแจ้งเตือน</h4>
          {unreadCount > 0 && (
            <span className="text-xs text-white bg-red-500 rounded-full px-2 py-0.5">
              {unreadCount} ใหม่
            </span>
          )}
        </div>
        
        <div className="max-h-64 overflow-y-auto space-y-2">
          {myNotifications.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">ไม่มีการแจ้งเตือน</p>
          ) : (
            myNotifications.map(notif => (
              <div 
                key={notif.id} 
                className={`p-3 rounded-lg ${notif.read ? 'bg-gray-50 dark:bg-gray-700' : 'bg-blue-50 dark:bg-blue-900 border border-blue-200'}`}
              >
                <p className="text-sm text-gray-800 dark:text-gray-100">{notif.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(notif.timestamp).toLocaleString()}
                </p>
                <div className="flex justify-end space-x-1 mt-2">
                  {!notif.read && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-green-500" onClick={() => markAsRead(notif.id)}>
                      <CheckCheck className="w-3 h-3 mr-1" /> อ่านแล้ว
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500" onClick={() => deleteNotification(notif.id)}>
                    <Trash2 className="w-3 h-3 mr-1" /> ลบ
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}