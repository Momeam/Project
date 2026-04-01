import { UserRole, VerificationStatus } from '@/stores/useAuthStore'; 

// 1. 🟢 Interface สำหรับข้อมูลยืนยันตัวตน
export interface VerificationDetails {
    fullName: string;
    idCardNumber: string;
    documentUrl: string;
    submittedAt: Date;
}

// 2. 🟢 Interface ผู้ใช้ (ไม่มีข้อมูล Mock Data)
export interface MockUser {
    id: string;
    email: string;
    password: string;
    role: UserRole;
    verificationStatus: VerificationStatus; 
    username: string;
    profileImageUrl?: string;
    verificationDetails?: VerificationDetails;
}

// 3. 🟢 ลบ MOCK_USERS_DATA และฟังก์ชันทั้งหมด (addNewMockUser, findMockUser ฯลฯ) ออกจากที่นี่
// (เพราะมันย้ายไปอยู่ใน useUserStore.ts แล้ว)

// --- 4. 🟢 Property Interfaces (ยังคงไว้เหมือนเดิม) ---
export type PropertyType = 'SALE' | 'RENT';
export type PropertyCategory = 'CONDO' | 'HOUSE' | 'LAND';

export interface PropertyImage {
    id: string;
    url: string;
    order: number;
}
export interface PropertyContact {
    phoneNumber: string;
    email: string;
    line?: string;
    facebook?: string;
}
export interface Property {
    id: string;
    userId: string;
    title: string;
    description: string;
    type: PropertyType; 
    category: PropertyCategory; 
    address: string;
    district: string;
    province: string;
    postalCode: string;
    price: number;
    size: number; 
    bedrooms: number;
    bathrooms: number;
    interiorDetails?: string;
    contact: PropertyContact;
    images: PropertyImage[];
    features: string[]; 
    createdAt: Date;
    updatedAt: Date;
    status: 'ACTIVE' | 'DRAFT' | 'INACTIVE' | 'PENDING' | 'SOLD' | 'BOOKED';
    viewCount: number;
    latitude?: number;
    longitude?: number;
    pricePerUnit?: number;
    floors?: number;
    yearBuilt?: number;
    downPaymentPercent?: number; 
    loanTerm?: number;
    interestRate?: number;
}