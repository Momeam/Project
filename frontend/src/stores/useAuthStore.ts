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
    usersList: User[];
    
    // Actions ที่หน้าบ้านไว้เรียกใช้ตอนล็อกอินผ่าน/ล็อกเอาท์
    loginSuccess: (user: User) => void; 
    logout: () => void;
    updateProfileDisplay: (updates: { username: string; profileImageUrl?: string }) => void;
    
    // Actions สำหรับจัดการผู้ใช้ (สำหรับ Admin)
    fetchUsers: () => Promise<void>;
    updateUserRole: (userId: string | number, role: UserRole) => Promise<void>;
    approveUserVerification: (userId: string | number) => Promise<void>;
    rejectUserVerification: (userId: string | number) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            // --- State พื้นฐาน ---
            isLoggedIn: false,
            currentUser: null,
            usersList: [],

            // --- Actions ---
            loginSuccess: (user) => {
                set({ 
                    isLoggedIn: true, 
                    currentUser: user 
                });
            },

            logout: () => {
                set({ 
                    isLoggedIn: false, 
                    currentUser: null 
                });
            },

            updateProfileDisplay: (updates) => {
                set((state) => ({
                    currentUser: state.currentUser ? { ...state.currentUser, ...updates } : null
                }));
            },

            fetchUsers: async () => {
                try {
                    const response = await fetch('http://localhost:5000/api/users');
                    const data = await response.json();
                    set({ usersList: data });
                } catch (error) {
                    console.error('Fetch users error:', error);
                }
            },

            updateUserRole: async (userId, role) => {
                try {
                    const response = await fetch(`http://localhost:5000/api/users/${userId}/role`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ role })
                    });
                    if (response.ok) {
                        const { user } = await response.json();
                        set((state) => ({
                            usersList: state.usersList.map(u => u.id === userId ? { ...u, role: user.role } : u)
                        }));
                    }
                } catch (error) {
                    console.error('Update user role error:', error);
                }
            },

            approveUserVerification: async (userId) => {
                // สำหรับตอนนี้เราจะใช้ role SELLER แทนการอนุมัติ
                await get().updateUserRole(userId, 'SELLER');
                set((state) => ({
                    usersList: state.usersList.map(u => u.id === userId ? { ...u, verificationStatus: 'APPROVED' } : u)
                }));
            },

            rejectUserVerification: async (userId) => {
                set((state) => ({
                    usersList: state.usersList.map(u => u.id === userId ? { ...u, verificationStatus: 'REJECTED' } : u)
                }));
            },
        }),
        { 
            name: 'auth-storage', 
        }
    )
);