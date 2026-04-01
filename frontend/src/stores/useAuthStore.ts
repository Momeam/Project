import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useFavoriteStore } from './useFavoriteStore';

// --- Types ---
export type VerificationStatus = 'IDLE' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type UserRole = 'USER' | 'SELLER' | 'ADMIN';

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
    token: string | null;
    usersList: User[];
    justUpgraded: boolean;
    
    loginSuccess: (user: User, token: string) => void; 
    logout: () => void;
    updateProfileDisplay: (updates: { username: string; profileImageUrl?: string }) => void;
    setJustUpgraded: (val: boolean) => void;
    
    fetchUsers: () => Promise<void>;
    updateUserRole: (userId: string | number, role: UserRole) => Promise<void>;
    deleteUser: (userId: string | number) => Promise<void>;
    approveUserVerification: (userId: string | number) => Promise<void>;
    rejectUserVerification: (userId: string | number) => Promise<void>;
    
    requestOtp: (tel: string) => Promise<string | null>;
    verifyOtp: (tel: string, otp: string, sellerData: { fullName: string; idCardNumber: string; email: string; lineId: string }) => Promise<{ success: boolean; error?: string }>;
    updateProfile: (profileData: { username?: string; tel?: string; line_id?: string }) => Promise<{ success: boolean; error?: string }>;
    changePassword: (passwordData: { oldPassword: string; newPassword: string }) => Promise<{ success: boolean; error?: string }>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            isLoggedIn: false,
            currentUser: null,
            token: null,
            usersList: [],
            justUpgraded: false,

            loginSuccess: (user, token) => {
                localStorage.setItem('token', token); // 👈 เพิ่มการบันทึก Token
                set({ 
                    isLoggedIn: true, 
                    currentUser: user,
                    token
                });
                // Fetch favorites after successful login
                useFavoriteStore.getState().fetchFavorites();
            },

            logout: () => {
                localStorage.removeItem('token'); // 👈 เพิ่มการลบ Token
                set({ 
                    isLoggedIn: false, 
                    currentUser: null,
                    token: null
                });
                // Clear favorites on logout
                useFavoriteStore.getState().clearFavorites();
            },

            updateProfileDisplay: (updates) => {
                set((state) => ({
                    currentUser: state.currentUser ? { ...state.currentUser, ...updates } : null
                }));
            },

            setJustUpgraded: (val) => set({ justUpgraded: val }),

            fetchUsers: async () => {
                try {
                    const token = get().token;
                    const response = await fetch('http://localhost:5000/api/users', {
                        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                    });
                    const data = await response.json();
                    if (!response.ok) {
                        console.warn('Fetch users failed:', data.error);
                        set({ usersList: [] });
                        return;
                    }
                    set({ usersList: Array.isArray(data) ? data : [] });
                } catch (error) {
                    console.error('Fetch users error:', error);
                    set({ usersList: [] }); // prevents crash if unauthorized
                }
            },

            updateUserRole: async (userId, role) => {
                try {
                    const token = get().token;
                    const response = await fetch(`http://localhost:5000/api/users/${userId}/role`, {
                        method: 'PUT',
                        headers: { 
                            'Content-Type': 'application/json',
                            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                        },
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
                    const token = get().token;
                    const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
                        method: 'DELETE',
                        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
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
                    const token = get().token;
                    const response = await fetch('http://localhost:5000/api/users/request-otp', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                        },
                        body: JSON.stringify({ tel })
                    });
                    const data = await response.json();
                    if (response.ok) {
                        return data.otp; 
                    }
                    return null;
                } catch (error) {
                    console.error('Request OTP error:', error);
                    return null;
                }
            },

            verifyOtp: async (tel, otp, sellerData) => {
                try {
                    const token = get().token;
                    const response = await fetch('http://localhost:5000/api/users/verify-otp', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                        },
                        body: JSON.stringify({ tel, otp, ...sellerData })
                    });
                    const data = await response.json();
                    if (response.ok) {
                        const currentUser = get().currentUser;
                        if (currentUser && currentUser.id === data.user.id) {
                            set({ 
                                currentUser: { ...currentUser, ...data.user },
                                justUpgraded: true
                            });
                        }
                        return { success: true };
                    }
                    return { success: false, error: data.error || 'เกิดข้อผิดพลาด' };
                } catch (error) {
                    console.error('Verify OTP error:', error);
                    return { success: false, error: 'ไม่สามารถเชื่อมต่อ Backend ได้ กรุณาตรวจสอบว่า Server เปิดอยู่' };
                }
            },

            updateProfile: async (profileData) => {
                try {
                    const token = get().token;
                    const response = await fetch('http://localhost:5000/api/users/me', {
                        method: 'PUT',
                        headers: { 
                            'Content-Type': 'application/json',
                            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                        },
                        body: JSON.stringify(profileData)
                    });
                    const data = await response.json();
                    if (response.ok) {
                        set((state) => ({
                            currentUser: state.currentUser ? { ...state.currentUser, ...data.user } : null
                        }));
                        return { success: true };
                    }
                    return { success: false, error: data.error || 'ไม่สามารถอัปเดตข้อมูลได้' };
                } catch (error) {
                    console.error('Update profile error:', error);
                    return { success: false, error: 'ไม่สามารถเชื่อมต่อ Backend ได้' };
                }
            },

            changePassword: async (passwordData) => {
                try {
                    const token = get().token;
                    const response = await fetch('http://localhost:5000/api/users/change-password', {
                        method: 'PUT',
                        headers: { 
                            'Content-Type': 'application/json',
                            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                        },
                        body: JSON.stringify(passwordData)
                    });
                    const data = await response.json();
                    if (response.ok) {
                        return { success: true };
                    }
                    return { success: false, error: data.error || 'ไม่สามารถเปลี่ยนรหัสผ่านได้' };
                } catch (error) {
                    console.error('Change password error:', error);
                    return { success: false, error: 'ไม่สามารถเชื่อมต่อ Backend ได้' };
                }
            },
        }),
        { 
            name: 'auth-storage', 
        }
    )
);