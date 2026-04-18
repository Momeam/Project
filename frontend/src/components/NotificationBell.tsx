'use client'

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, Trash2, CheckCheck, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';

export function NotificationBell() {
  const [isMounted, setIsMounted] = useState(false);
  const { notifications, fetchNotifications, markAsRead, deleteNotification, loading } = useNotificationStore();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    setIsMounted(true);
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  if (!isMounted || !user) {
    return (
      <Button variant="ghost" size="icon" className="text-gray-700 dark:text-gray-300">
        <Bell className="h-5 w-5" />
      </Button>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-gray-700 dark:text-gray-300">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 dark:bg-gray-800" align="end">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium text-lg">การแจ้งเตือน</h4>
          {unreadCount > 0 && <span className="text-xs text-white bg-red-500 rounded-full px-2 py-0.5">{unreadCount} ใหม่</span>}
        </div>
        
        <div className="max-h-64 overflow-y-auto space-y-2">
          {loading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">ไม่มีการแจ้งเตือน</p>
          ) : (
            notifications.map(notif => (
              <div key={notif.id} className={`p-3 rounded-lg ${notif.is_read ? 'bg-gray-50 dark:bg-gray-700' : 'bg-blue-50 dark:bg-blue-900 border border-blue-200'}`}>
                <p className="text-sm text-gray-800 dark:text-gray-100">{notif.message}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(notif.created_at).toLocaleString('th-TH')}</p>
                <div className="flex justify-end space-x-1 mt-2">
                  {!notif.is_read && (
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