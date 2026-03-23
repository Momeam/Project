import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserRole, VerificationStatus } from '@/stores/useAuthStore';
import { MockUser, VerificationDetails } from '@/lib/types'; // (เราจะย้าย Interface มาไว้ใน types.ts)

// (ข้อมูลเริ่มต้น - จะถูกโหลดแค่ครั้งแรกที่ User เปิดเว็บ)
const INITIAL_USERS: MockUser[] = [
    { id: '1', email: 'user@test.com', password: 'password', role: 'USER', verificationStatus: 'NONE', username: 'TestUser' },
    { id: '2', email: 'admin@test.com', password: 'password', role: 'ADMIN', verificationStatus: 'APPROVED', username: 'TestAdmin' },
    { id: '3', email: 'seller@test.com', password: 'password', role: 'SELLER', verificationStatus: 'APPROVED', username: 'TestSeller' },
    { 
      id: '4', 
      email: 'pending@test.com', 
      password: 'password', 
      role: 'USER', 
      verificationStatus: 'PENDING',
      username: 'TestPending',
      verificationDetails: {
        fullName: 'นายกำลังรอ อนุมัติ',
        idCardNumber: '1234567890123',
        documentUrl: 'https://placehold.co/400?text=Pending+Doc',
        submittedAt: new Date()
      }
    },
];

// (Interface ของ Store)
interface UserStoreState {
  users: MockUser[];
  
  // 🟢 ย้ายฟังก์ชันทั้งหมดจาก types.ts มาเป็น Actions
  addNewMockUser: (user: { email: string; password: string; username: string }) => MockUser;
  findMockUser: (email: string, password?: string) => MockUser | undefined;
  updateUserProfile: (email: string, updates: { username: string; profileImageUrl: string }) => MockUser | undefined;
  requestVerification: (email: string, details: Omit<VerificationDetails, 'submittedAt'>) => void;
  approveUser: (email: string) => void;
  rejectUser: (email: string) => void;
  // (เราจะไม่ใช้ getPendingRequests/getAllUsers ที่นี่ แต่จะ filter จาก state.users โดยตรง)
}

// (สร้าง Store)
export const useUserStore = create<UserStoreState>()(
  persist(
    (set, get) => ({
      users: INITIAL_USERS,

      findMockUser: (email, password) => {
        const user = get().users.find(u => 
            u.email === email && (!password || u.password === password)
        );
        return user;
      },

      addNewMockUser: (user) => {
        const newUser: MockUser = {
            id: `mock-${Date.now()}`,
            email: user.email,
            password: user.password,
            username: user.username, 
            role: 'USER', 
            verificationStatus: 'NONE', 
        };
        set((state) => ({ users: [...state.users, newUser] }));
        return newUser;
      },
      
      updateUserProfile: (email, updates) => {
        let updatedUser: MockUser | undefined;
        set((state) => ({
            users: state.users.map(u => {
                if (u.email === email) {
                    updatedUser = { ...u, ...updates };
                    return updatedUser;
                }
                return u;
            })
        }));
        return updatedUser;
      },

      requestVerification: (email, details) => {
        set((state) => ({
            users: state.users.map(u => 
                u.email === email ? { 
                    ...u, 
                    verificationStatus: 'PENDING',
                    verificationDetails: { ...details, submittedAt: new Date() } 
                } : u
            )
        }));
      },

      approveUser: (email) => {
        set((state) => ({
            users: state.users.map(u => 
                u.email === email ? { ...u, role: 'SELLER', verificationStatus: 'APPROVED' } : u
            )
        }));
      },

      rejectUser: (email) => {
        set((state) => ({
            users: state.users.map(u => 
                u.email === email ? { ...u, verificationStatus: 'NONE', verificationDetails: undefined } : u
            )
        }));
      },
    }),
    {
      name: 'user-database-storage', // 👈 (ชื่อ Key ใน LocalStorage)
    }
  )
);