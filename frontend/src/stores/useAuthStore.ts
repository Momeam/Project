import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'USER' | 'SELLER' | 'ADMIN';
export type VerificationStatus = 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED';

interface AuthState {

    currentUser: any | null; // ข้อมูลผู้ใช้จากดาต้าเบส
    token: string | null;
    isAuthenticated: boolean;
    _hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;
    login: (userData: any, token: string) => void;
    logout: () => void;
    refreshUser: () => Promise<void>;
    
    // User Management (Admin functions)
    usersList: any[];
    justUpgraded: boolean;
    fetchUsers: () => Promise<void>;

    updateUserRole: (userId: string | number, role: UserRole) => Promise<void>;
    deleteUser: (userId: string | number) => Promise<void>;

    // Profile Management
    updateProfile: (profileData: { username?: string; tel?: string; line_id?: string }) => Promise<{ success: boolean; error?: string }>;
    changePassword: (passwordData: { oldPassword: string; newPassword: string }) => Promise<{ success: boolean; error?: string }>;
}

export const useAuthStore = create<AuthState>()(

    persist(
        (set, get) => ({
            currentUser: null,
            token: null,
            isAuthenticated: false,
            _hasHydrated: false,
            justUpgraded: false,
            usersList: [],

            setHasHydrated: (state) => set({ _hasHydrated: state }),
            login: (userData, token) => {
                localStorage.setItem('token', token);
                set({ currentUser: userData, token, isAuthenticated: true });
            },
            logout: () => {
                localStorage.removeItem('token');
                set({ currentUser: null, token: null, isAuthenticated: false });
            },

            refreshUser: async () => {
                // พยายามดึง Token จาก Store ถ้าไม่มีให้ดูใน LocalStorage (รองรับ Session เดิม)
                let token = get().token;
                if (!token) {
                    token = localStorage.getItem('token');
                    if (token) set({ token }); // เก็บค่าที่เจอลง Store
                }

                if (!token) return;

                try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/users/me`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    if (res.ok) {
                        const freshUser = await res.json();
                        set({ currentUser: freshUser, isAuthenticated: true });
                    } else if (res.status === 401) {
                        // ถ้า Token ใช้ไม่ได้แล้ว (เช่น User ถูกลบ) ให้ Log out
                        localStorage.removeItem('token');
                        set({ currentUser: null, token: null, isAuthenticated: false });
                    }

                } catch (err) {
                    console.error('Failed to refresh user:', err);
                }
            },

            fetchUsers: async () => {
                try {
                    let token = get().token;
                    if (!token) token = localStorage.getItem('token');
                    
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/users`, {
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
                    set({ usersList: [] });
                }
            },

            updateUserRole: async (userId, role) => {
                try {
                    let token = get().token;
                    if (!token) token = localStorage.getItem('token');
                    
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/users/${userId}/role`, {
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
                            usersList: state.usersList.map((u: any) => u.id === userId ? { ...u, role: user.role } : u)
                        }));
                    }
                } catch (error) {
                    console.error('Update user role error:', error);
                }
            },

            deleteUser: async (userId) => {
                try {
                    let token = get().token;
                    if (!token) token = localStorage.getItem('token');
                    
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/users/${userId}`, {
                        method: 'DELETE',
                        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                    });
                    
                    if (response.ok) {
                        set((state) => ({
                            usersList: state.usersList.filter((u: any) => u.id !== userId)
                        }));
                    }
                } catch (error) {
                    console.error('Delete user error:', error);
                }
            },

            updateProfile: async (profileData) => {
                try {
                    let token = get().token;
                    if (!token) token = localStorage.getItem('token');
                    
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/users/me`, {
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
                    let token = get().token;
                    if (!token) token = localStorage.getItem('token');
                    
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/users/change-password`, {
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
            }
        }),

        {
            name: 'auth-storage', // บันทึกการล็อกอินลง LocalStorage จะได้ไม่ต้องล็อกอินใหม่เวลารีเฟรช
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            }
        }
    )
);

