import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
    user: any | null; // เก็บข้อมูล User จาก Database จริงตอนล็อกอิน
    isAuthenticated: boolean;
    login: (userData: any) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            login: (userData) => set({ user: userData, isAuthenticated: true }),
            logout: () => set({ user: null, isAuthenticated: false }),
        }),
        {
            name: 'auth-storage', // บันทึกการล็อกอินลง LocalStorage จะได้ไม่ต้องล็อกอินใหม่เวลารีเฟรช
        }
    )
);