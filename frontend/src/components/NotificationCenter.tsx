'use client'

import { useState, useEffect } from 'react';
import { Bell, X, Heart, Trash2, Flag } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Notification {
  id: number;
  type: 'FAVORITED' | 'PROPERTY_DELETED' | 'REPORT';
  message: string;
  is_read: boolean;
  property_id: number;
  created_at: string;
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error('fetch notifications error:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (err) {
      console.error('mark read error:', err);
    }
  };

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('mark all read error:', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'FAVORITED': return <Heart className="w-4 h-4 text-pink-500" />;
      case 'PROPERTY_DELETED': return <Trash2 className="w-4 h-4 text-red-500" />;
      case 'REPORT': return <Flag className="w-4 h-4 text-amber-500" />;
      default: return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        className="relative rounded-full hover:bg-slate-100 border-slate-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-blue-600' : 'text-slate-600'}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
          <Card className="absolute right-0 mt-3 w-80 md:w-96 max-h-[500px] overflow-hidden z-[70] border-slate-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold">
                <Bell className="w-4 h-4" />
                การแจ้งเตือน
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                    {unreadCount} ใหม่
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-slate-300 hover:text-white underline"
                  >
                    อ่านทั้งหมด
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="hover:bg-slate-800 p-1 rounded-full">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <CardContent className="p-0 overflow-y-auto max-h-[420px]">
              {notifications.length === 0 ? (
                <div className="p-10 text-center text-slate-400 flex flex-col items-center gap-2">
                  <Bell className="w-10 h-10 opacity-20" />
                  <p className="text-sm">ยังไม่มีการแจ้งเตือน</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => !item.is_read && markAsRead(item.id)}
                      className={`p-4 flex items-start gap-3 cursor-pointer hover:bg-slate-50 transition-colors ${
                        !item.is_read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="p-2 bg-white border border-slate-100 rounded-xl mt-0.5">
                        {getIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800 leading-snug">{item.message}</p>
                        <p className="text-[11px] text-slate-400 mt-1">{formatDate(item.created_at)}</p>
                      </div>
                      {!item.is_read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}