// src/components/NotificationBell.tsx
'use client'

import React from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"; 
import { useNotificationStore, Notification } from '@/stores/useNotificationStore'; 
import { useAuthStore } from '@/stores/useAuthStore'; 

export function NotificationBell() {
  const currentUserEmail = useAuthStore((state) => state.email);
  const { notifications, markAsRead, deleteNotification } = useNotificationStore();

  const myNotifications = currentUserEmail
    ? notifications
        .filter(n => n.recipientEmail === currentUserEmail.toLowerCase())
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) 
    : [];

  const unreadCount = myNotifications.filter(n => !n.read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-gray-700 dark:text-gray-300">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 mr-4">
        <div className="grid gap-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium leading-none">การแจ้งเตือน ({unreadCount})</h4>
          </div>
          <div className="grid gap-2 max-h-60 overflow-y-auto">
            {myNotifications.length === 0 ? (
              <p className="text-sm text-gray-500 text-center">ไม่มีการแจ้งเตือน</p>
            ) : (
              myNotifications.map(notif => (
                <div
                  key={notif.id}
                  className={`grid grid-cols-[25px_1fr_25px] items-start pb-4 last:pb-0 ${!notif.read ? 'font-semibold' : 'text-gray-600 dark:text-gray-300'}`}
                >
                  <span className={`flex h-2 w-2 translate-y-1 rounded-full ${!notif.read ? 'bg-sky-500' : 'bg-gray-400'}`} />
                  <div className="grid gap-1" onClick={() => markAsRead(notif.id)}>
                    <p className="text-sm">{notif.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(notif.timestamp).toLocaleString('th-TH')}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500" onClick={() => deleteNotification(notif.id)}>
                    <CheckCheck className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}