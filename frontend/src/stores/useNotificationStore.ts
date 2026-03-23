import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * 1. รูปแบบ (Interface) ของการแจ้งเตือน
 */
export interface Notification {
  id: string;
  recipientEmail: string; // 👈 ส่งถึงใคร
  message: string;        // 👈 ข้อความ
  read: boolean;          // 👈 อ่านหรือยัง
  timestamp: Date;        // 👈 เวลาที่ส่ง
}

/**
 * 2. State และ Actions ของ Store
 */
interface NotificationState {
  notifications: Notification[];
  
  // Action: (Admin ใช้) เพิ่มการแจ้งเตือนใหม่
  addNotification: (recipientEmail: string, message: string) => void;
  
  // Action: (User/Seller ใช้) กดอ่าน
  markAsRead: (id: string) => void;
  
  // Action: (User/Seller ใช้) ลบการแจ้งเตือน
  deleteNotification: (id: string) => void;
}

/**
 * 3. สร้าง Store
 */
export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      
      // สถานะเริ่มต้น: กล่องจดหมายว่างเปล่า
      notifications: [],

      /**
       * (Admin) เพิ่มการแจ้งเตือนใหม่
       */
      addNotification: (recipientEmail, message) => {
        const newNotif: Notification = {
          id: `notif-${Date.now()}`,
          recipientEmail: recipientEmail.toLowerCase(), // (เก็บเป็นตัวพิมพ์เล็ก)
          message,
          read: false,
          timestamp: new Date(),
        };
        
        set((state) => ({
          notifications: [...state.notifications, newNotif]
        }));
        
        console.log(`[Notification] Sent to: ${recipientEmail}`);
      },

      /**
       * (User/Seller) อัปเดตสถานะ "อ่านแล้ว"
       */
      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
          )
        }));
      },
      
      /**
       * (User/Seller) ลบการแจ้งเตือน
       */
      deleteNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }));
      }
      
    }),
    {
      name: 'notification-storage', // 👈 ชื่อ Key ใน localStorage
    }
  )
);