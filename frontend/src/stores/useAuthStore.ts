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
    full_name?: string;
    id_card_number?: string;
    line_id?: string;
    verificationStatus?: VerificationStatus;
}

interface AuthState {
    isLoggedIn: boolean;
    currentUser: User | null;
    usersList: User[];
    justUpgraded: boolean; // 👈 เพิ่ม state ใหม่
    
    // Actions ที่หน้าบ้านไว้เรียกใช้ตอนล็อกอินผ่าน/ล็อกเอาท์
    loginSuccess: (user: User) => void; 
    logout: () => void;
    updateProfileDisplay: (updates: { username: string; profileImageUrl?: string }) => void;
    setJustUpgraded: (val: boolean) => void; // 👈 เพิ่ม action ใหม่
    
    // Actions สำหรับจัดการผู้ใช้ (สำหรับ Admin)
    fetchUsers: () => Promise<void>;
    updateUserRole: (userId: string | number, role: UserRole) => Promise<void>;
    deleteUser: (userId: string | number) => Promise<void>;
    approveUserVerification: (userId: string | number) => Promise<void>;
    rejectUserVerification: (userId: string | number) => Promise<void>;
    
    // Actions สำหรับ Seller OTP
    requestOtp: (tel: string) => Promise<string | null>;
    verifyOtp: (tel: string, otp: string, sellerData: { fullName: string; idCardNumber: string; email: string; lineId: string }) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            // --- State พื้นฐาน ---
            isLoggedIn: false,
            currentUser: null,
            usersList: [],
            justUpgraded: false, // 👈 เริ่มต้นเป็น false

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

            setJustUpgraded: (val) => set({ justUpgraded: val }), // 👈 เพิ่ม action

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

            deleteUser: async (userId) => {
                try {
                    const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
                        method: 'DELETE'
                    });
                    if (response.ok) {
                        set((state) => ({
                            usersList: state.usersList.filter(u => u.id !== userId)
                        }));
                    }
                } catch (error) {
                    console.error('Delete user error:', error);
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

            requestOtp: async (tel) => {
                try {
                    const response = await fetch('http://localhost:5000/api/users/request-otp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ tel })
                    });
                    const data = await response.json();
                    if (response.ok) {
                        return data.otp; // ส่ง OTP กลับไปเพื่อจำลองการรับ OTP
                    }
                    return null;
                } catch (error) {
                    console.error('Request OTP error:', error);
                    return null;
                }
            },

            verifyOtp: async (tel, otp, sellerData) => {
                try {
                    const response = await fetch('http://localhost:5000/api/users/verify-otp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ tel, otp, ...sellerData })
                    });
                    const data = await response.json();
                    if (response.ok) {
                        // อัปเดต currentUser ใน store ทันทีถ้าเป็นผู้ใช้ที่ล็อกอินอยู่
                        const currentUser = get().currentUser;
                        if (currentUser && currentUser.id === data.user.id) {
                            set({ 
                                currentUser: { ...currentUser, ...data.user },
                                justUpgraded: true // 👈 ตั้งค่าเป็น true ทันทีหลังสำเร็จ
                            });
                        }
                        return true;
                    }
                    return false;
                } catch (error) {
                    console.error('Verify OTP error:', error);
                    return false;
                }
            },
        }),
        { 
            name: 'auth-storage', 
        }
    )
);