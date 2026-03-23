'use client'

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send } from 'lucide-react';

// 1. 🟢 นำเข้า Action จาก Store ที่เราเพิ่งสร้าง
import { useNotificationStore } from '@/stores/useNotificationStore';

export function NotificationSender() {
  
  // 2. 🟢 ดึง Action `addNotification` มาใช้
  const addNotification = useNotificationStore((state) => state.addNotification);

  // 3. 🟢 สร้าง State สำหรับฟอร์ม
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) {
      alert('กรุณากรอกอีเมลผู้รับและข้อความ');
      return;
    }
    
    // 4. 🟢 เรียก Action เพื่อส่งการแจ้งเตือน
    addNotification(email, message);
    
    alert(`ส่งการแจ้งเตือนไปยัง ${email} สำเร็จ!`);
    setEmail('');
    setMessage('');
  };

  return (
    <Card className="dark:bg-gray-800 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Send className="w-5 h-5 mr-2 text-green-500" /> 
          ส่งการแจ้งเตือน (Notification Sender)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* อีเมลผู้รับ */}
            <div className="md:col-span-1">
              <Label htmlFor="recipient-email">อีเมลผู้รับ</Label>
              <Input
                id="recipient-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@test.com"
                required
              />
            </div>

            {/* ข้อความ */}
            <div className="md:col-span-2">
              <Label htmlFor="message-text">ข้อความแจ้งเตือน</Label>
              <Input
                id="message-text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="เช่น: บัญชี Seller ของคุณได้รับการอนุมัติแล้ว"
                required
              />
            </div>
          </div>
          
          <Button type="submit" className="w-full md:w-auto bg-green-600 hover:bg-green-700">
            <Send className="w-4 h-4 mr-2" />
            ส่งการแจ้งเตือน
          </Button>
          
        </form>
      </CardContent>
    </Card>
  );
}