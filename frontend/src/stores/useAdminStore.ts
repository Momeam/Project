// src/stores/useAdminStore.ts
import { create } from 'zustand';
// 1. 🟢 นำเข้า persist middleware
import { persist } from 'zustand/middleware';

export interface PropertyListing {
  id: string;
  title: string;
  price: number;
  type: 'For Sale' | 'For Rent';
  imageUrl: string;
}

interface AdminState {
  listings: PropertyListing[];
  addListing: (title: string, price: number, type: PropertyListing['type'], imageUrl: string) => void;
  deleteListing: (id: string) => void;
  deleteAllListings: () => void;
}

// 2. 🟢 แก้ไข: ครอบ create() ด้วย persist()
export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      // สถานะเริ่มต้น (Mock Data)
      listings: [
        { 
          id: 'prop-1', 
          title: 'ขายคอนโด 1 นอน ใกล้ BTS (Admin Post)', 
          price: 4500000, 
          type: 'For Sale',
          imageUrl: 'https://via.placeholder.com/400x300.png?text=Property+1'
        },
        { 
          id: 'prop-2', 
          title: 'ให้เช่าบ้านเดี่ยว 3 นอน (Admin Post)', 
          price: 35000, 
          type: 'For Rent',
          imageUrl: 'https://via.placeholder.com/400x300.png?text=Property+2'
        },
      ],
      
      // Action "Add"
      addListing: (title, price, type, imageUrl) => set((state) => ({
        listings: [
          ...state.listings,
          {
            id: `prop-${Date.now()}`,
            title,
            price,
            type,
            imageUrl,
          },
        ],
      })),
      
      // Action "Delete"
      deleteListing: (id) => set((state) => ({
        listings: state.listings.filter(item => item.id !== id),
      })),

      // Action "Delete All"
      deleteAllListings: () => set({ listings: [] }),
    }),
    
    // 3. 🟢 เพิ่มการตั้งค่า persist
    {
      name: 'admin-listing-storage', // ชื่อ Key ที่จะใช้เก็บใน localStorage
    }
  )
);