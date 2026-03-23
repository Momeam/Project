import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// --- Types ---
export type VerificationStatus = 'IDLE' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type UserRole = 'USER' | 'SELLER' | 'ADMIN';

// โครงสร้าง User ให้ตรงกับสิ่งที่ได้มาจาก Backend
export interface User {
    id: string | number;
    username: string;
    email: string;
    role: UserRole;
    tel?: string;
    verificationStatus?: VerificationStatus;
}

interface AuthState {
    isLoggedIn: boolean;
    currentUser: User | null;
    
    // Actions ที่หน้าบ้านไว้เรียกใช้ตอนล็อกอินผ่าน/ล็อกเอาท์
    loginSuccess: (user: User) => void; 
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            // --- State พื้นฐาน ---
            isLoggedIn: false,
            currentUser: null,

            // --- Actions ---
            // ⭐️ เมื่อ Backend บอกว่าล็อกอินผ่าน ก็ส่งข้อมูล User มาเก็บไว้ที่นี่
            loginSuccess: (user) => {
                set({ 
                    isLoggedIn: true, 
                    currentUser: user 
                });
            },

            // ⭐️ เคลียร์ข้อมูลทิ้งตอนกดออกจากระบบ
            logout: () => {
                set({ 
                    isLoggedIn: false, 
                    currentUser: null 
                });
            },
        }),
        { 
            name: 'auth-storage', // ชื่อกุญแจที่ใช้เซฟลง LocalStorage 
        }
    )
);