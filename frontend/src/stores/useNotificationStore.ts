import { create } from 'zustand';
import axios from 'axios';

/**
 * 1. รูปแบบข้อมูล (Interface) อิงตามตารางใน Database
 */
export interface Notification {
  id: number;           // เปลี่ยนเป็น number ตาม SERIAL ใน DB
  recipient_id: number; // อ้างอิง ID ของ User
  message: string;
  is_read: boolean;     // เปลี่ยนจาก read เป็น is_read ตาม DB
  type: string;
  created_at: string;   // เวลาจาก Server
}

interface NotificationState {
  notifications: Notification[];
  loading: boolean;
  
  // Actions
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  deleteNotification: (id: number) => Promise<void>; // (ถ้าจะทำระบบลบ)
}

/**
 * 2. สร้าง Store ใหม่แบบไม่ใช้ persist (เพราะเราจะดึงจาก API ทุกครั้งที่หน้าเว็บโหลด)
 */
export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  loading: false,

  // ดึงข้อมูลแจ้งเตือนจาก Database ผ่าน API
  fetchNotifications: async () => {
    set({ loading: true });
    try {
      // เรียกไปยัง Route ที่เราจะสร้างที่ Backend
      const res = await axios.get('/api/notifications'); 
      set({ notifications: res.data, loading: false });
    } catch (error) {
      console.error("Fetch notifications failed:", error);
      set({ loading: false });
    }
  },

  // อัปเดตสถานะ "อ่านแล้ว" ลง Database
  markAsRead: async (id) => {
    try {
      await axios.put(`/api/notifications/${id}/read`);
      
      // อัปเดต State ในหน้าจอทันที ไม่ต้องรอ Refresh
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        ),
      }));
    } catch (error) {
      console.error("Mark as read failed:", error);
    }
  },

  // ลบการแจ้งเตือนจาก Database (ถ้าต้องการ)
  deleteNotification: async (id) => {
    try {
      await axios.delete(`/api/notifications/${id}`);
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    } catch (error) {
      console.error("Delete notification failed:", error);
    }
  },
}));