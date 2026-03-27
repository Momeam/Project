import { create } from 'zustand';

// --- Interfaces ---
export interface PropertyImage {
    id: string;
    url: string;
    order: number;
}

// ⭐️⭐️ แก้ไข: เพิ่ม line และ facebook เข้าไปใน Contact ⭐️⭐️
export interface PropertyContact {
    phoneNumber: string;
    email: string;
    line?: string; // 👈 เพิ่ม Line ID
    facebook?: string; // 👈 เพิ่ม Facebook URL
}

// ⭐️⭐️ แก้ไข: เพิ่มฟิลด์ที่ฟอร์มลงประกาศใช้ ⭐️⭐️
export interface Property {
    id: string;
    userId: string;
    title: string;
    description: string;
    type: 'SALE' | 'RENT';
    category: 'CONDO' | 'HOUSE' | 'LAND';
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
    status: 'ACTIVE' | 'DRAFT' | 'INACTIVE' | 'PENDING';
    viewCount: number;
    latitude?: number; 
    longitude?: number;

    // ⭐️⭐️ ฟิลด์เพิ่มเติมที่ VS Code ฟ้องว่าขาดไป ⭐️⭐️
    pricePerUnit?: number; // ราคาต่อหน่วย (เช่น ต่อ ตร.ม.)
    floors?: number; // จำนวนชั้น
    yearBuilt?: number; // ปีที่สร้าง
    downPaymentPercent?: number; // เปอร์เซ็นต์เงินดาวน์เริ่มต้น (ใช้ใน Loan Calculator)
    loanTerm?: number; // ระยะเวลากู้เริ่มต้น (ใช้ใน Loan Calculator)
    interestRate?: number; // อัตราดอกเบี้ยเริ่มต้น (ใช้ใน Loan Calculator)
}

interface PropertyState {
    properties: Property[];
    getPropertyById: (id: string) => Property | undefined;
    
    // ... (Comparison Actions) ...
    comparisonList: string[];
    addToCompare: (id: string) => void;
    removeFromCompare: (id: string) => void;
    clearCompareList: () => void;

    // ... (Management Actions) ...
    addProperty: (property: Property) => void; 
    updatePropertyStatus: (id: string, status: 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'PENDING') => void; 
    deleteProperty: (id: string, userId: string, role: string) => void; 
    searchProperties: (query: string) => Property[];
}

// --- Mock Data (ต้องอัปเดตให้ครบตาม Interface ใหม่ด้วย) ---
const MOCK_PROPERTIES: Property[] = [
    {
        id: 'p1', userId: 'u1', title: 'คอนโดหรูใจกลางอโศก (สำหรับขาย)',
        description: 'คอนโดสุดหรู 1 ห้องนอน 1 ห้องน้ำ ใกล้ BTS อโศก...',
        type: 'SALE', category: 'CONDO',
        address: '123 ถ.สุขุมวิท 21', district: 'คลองเตย', province: 'กรุงเทพฯ',
        postalCode: '10110', price: 5500000, size: 35,
        bedrooms: 1, bathrooms: 1,
        interiorDetails: 'เฟอร์นิเจอร์ครบชุด, เครื่องปรับอากาศ 2 เครื่อง',
        // ⭐️ อัปเดต Contact
        contact: { phoneNumber: '0812345678', email: 'seller1@test.com', line: 'seller_line_1', facebook: 'facebook.com/s1' },
        images: [{ id: 'i1', url: 'https://placehold.co/800x600/a2d2ff/ffffff?text=Condo+Image+1', order: 1 }],
        features: ['สระว่ายน้ำ', 'ฟิตเนส'],
        createdAt: new Date(), updatedAt: new Date(),
        status: 'ACTIVE', viewCount: 150,
        latitude: 13.7383, longitude: 100.5611,
        // ⭐️ ข้อมูลเพิ่มเติม
        pricePerUnit: 5500000 / 35, floors: 20, yearBuilt: 2018,
        loanTerm: 30, interestRate: 3.5
    },
    // ... (ข้อมูล p2 และ p_pending_1 ที่เหลือควรถูกอัปเดตให้ครบถ้วนเช่นกัน)
];

// --- Store Creation ---
export const usePropertyStore = create<PropertyState>((set, get) => ({
    properties: MOCK_PROPERTIES, 
    getPropertyById: (id) => get().properties.find((p) => p.id === id),
    // ... (Actions ทั้งหมด) ...
    searchProperties: (query) => {
        if (!query) return get().properties.filter(p => p.status === 'ACTIVE');
        const lowerCaseQuery = query.toLowerCase();
        return get().properties.filter(p => {
            if (p.status !== 'ACTIVE') return false; 
            const searchFields = [p.title, p.address, p.district, p.province, ...p.features];
            return searchFields.some(f => f.toLowerCase().includes(lowerCaseQuery));
        });
    }
}));