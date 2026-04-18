import { create } from 'zustand';

interface PropertyState {
    properties: any[];
    isLoading: boolean;
    error: string | null;
    fetchProperties: () => Promise<void>;
    getPropertyById: (id: string) => any;
}

export const usePropertyStore = create<PropertyState>((set, get) => ({
    properties: [],
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

    // 🟢 ค้นหาบ้านจาก ID
    getPropertyById: (id: string) => {
        return get().properties.find((p) => String(p.id) === String(id));
    }
}));