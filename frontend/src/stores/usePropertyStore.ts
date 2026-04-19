import { create } from 'zustand';

interface PropertyState {
    properties: any[];
    myProperties: any[];
    isLoading: boolean;
    error: string | null;
    fetchProperties: () => Promise<void>;
    fetchMyProperties: (userId: string | number) => Promise<void>;
    getPropertyById: (id: string) => any;
}

export const usePropertyStore = create<PropertyState>((set, get) => ({
    properties: [],
    myProperties: [],
    isLoading: false,
    error: null,

    // 🟢 วิ่งไปดึงข้อมูลบ้านทั้งหมดจาก Database ตัวจริง
    fetchProperties: async () => {
        set({ isLoading: true, error: null });
        try {
            const res = await fetch('/api/properties');
            if (!res.ok) throw new Error('ดึงข้อมูลไม่สำเร็จ');
            const data = await res.json();
            // Normalize userid (PostgreSQL lowercase) -> userId (camelCase)
            const normalized = data.map((p: any) => ({
                ...p,
                userId: p.userId || p.userid,
            }));
            set({ properties: normalized, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    // 🟢 ดึงเฉพาะประกาศของผู้ขายคนนี้ (ไม่โหลดของคนอื่น)
    fetchMyProperties: async (userId: string | number) => {
        set({ isLoading: true, error: null });
        try {
            const res = await fetch(`/api/properties/seller/${userId}`);
            if (!res.ok) throw new Error('ดึงข้อมูลประกาศของฉันไม่สำเร็จ');
            const data = await res.json();
            const normalized = data.map((p: any) => ({
                ...p,
                userId: p.userId || p.userid,
            }));
            set({ myProperties: normalized, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    // 🟢 ค้นหาบ้านจาก ID
    getPropertyById: (id: string) => {
        return get().properties.find((p) => String(p.id) === String(id));
    }
}));