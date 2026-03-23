// src/stores/useListingStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Listing {
  id: string;
  title: string;
  price: number;
  type: 'Sale' | 'Rent';
  status: 'Active' | 'Pending';
  authorEmail: string; // 🟢 ระบุว่าใครเป็นคนโพสต์
}

interface ListingState {
  listings: Listing[];
  addListing: (data: Omit<Listing, 'id' | 'status'>) => void;
  deleteListing: (id: string) => void;
}

export const useListingStore = create<ListingState>()(
  persist(
    (set) => ({
      // สถานะเริ่มต้น
      listings: [
        { 
          id: 'l-1', 
          title: 'คอนโด 1 ห้องนอน ใกล้ BTS (Mock)', 
          price: 4500000, 
          type: 'Sale', 
          status: 'Active',
          authorEmail: 'seller@test.com'
        },
      ],
      
      addListing: (data) => set((state) => ({
        listings: [
          ...state.listings,
          {
            ...data,
            id: `l-${Date.now()}`,
            status: 'Pending', 
          },
        ],
      })),
      
      deleteListing: (id) => set((state) => ({
        listings: state.listings.filter(listing => listing.id !== id),
      })),
    }),
    {
      name: 'listing-storage', // ชื่อ key ใน localStorage
    }
  )
);