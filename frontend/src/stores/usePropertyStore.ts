import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// --- 1. Interfaces ---
export interface PropertyImage { id: string; url: string; order: number; }
export interface PropertyContact { id: string; phoneNumber: string; email: string; }

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
    landSize?: number;
    bedrooms: number; 
    bathrooms: number;
    interiorDetails?: string;
    floor?: number; 
    yearBuilt?: number; 
    furniture?: 'NONE' | 'PARTLY' | 'FULLY'; 
    parking?: number; 
    nearbyTransport?: string; 
    deposit?: number; 
    minContract?: number; 
    contact: PropertyContact; 
    images: PropertyImage[]; 
    features: string[];
    createdAt: string; 
    updatedAt: string; 
    status: 'ACTIVE' | 'DRAFT' | 'INACTIVE' | 'PENDING';
    viewCount: number; 
    latitude?: number; 
    longitude?: number;
    isFavorite?: boolean; 
}

// --- 2. Mock Data ---
const INITIAL_MOCK: Property[] = []; // ปล่อยว่างไว้เพราะเราจะดึงจาก SQL เป็นหลักแล้ว

// --- 3. State & Actions Interface ---
interface PropertyState {
    properties: Property[];
    isLoading: boolean;
    error: string | null;

    fetchProperties: () => Promise<void>;
    getPropertyById: (id: string) => Property | undefined;
    toggleFavorite: (id: string) => void;
    addProperty: (property: Property) => void;
    updatePropertyStatus: (id: string, status: Property['status']) => void;
    deleteProperty: (id: string, userId: string, role: string) => void;
    
    comparisonList: string[];
    addToCompare: (id: string) => void;
    removeFromCompare: (id: string) => void;
    clearCompareList: () => void;
}

// --- 4. Store Creation ---
export const usePropertyStore = create<PropertyState>()(
    persist(
        (set, get) => ({
            properties: INITIAL_MOCK,
            isLoading: false,
            error: null,
            comparisonList: [],

            // 🚀 ฟังก์ชันดึงข้อมูล (ออโต้ดึง IP เครื่อง)
            fetchProperties: async () => {
                set({ isLoading: true });
                try {
                    const currentIP = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
                    const response = await fetch(`http://${currentIP}:5000/api/properties`);
                    if (!response.ok) throw new Error('Failed to fetch data');
                    
                    const data = await response.json();
                    const safeData = data.map((item: any) => ({
                        ...item,
                        interiorDetails: item.interiordetails || item.interiorDetails || '',
                        images: item.images || [],
                        features: item.features || [],
                        contact: item.contact || { id: 'c_default', phoneNumber: '-', email: '-' }
                    }));

                    set({ properties: safeData, isLoading: false });
                } catch (err: any) {
                    set({ error: err.message, isLoading: false });
                    console.log("Backend not ready, using local data.");
                }
            },

            getPropertyById: (id) => get().properties.find((p) => p.id === id),

            toggleFavorite: (id) => set((state) => ({
                properties: state.properties.map((p) => 
                    p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
                )
            })),

            addProperty: (newProperty) => set((state) => ({ 
                properties: [newProperty, ...state.properties] 
            })),

            updatePropertyStatus: (id, status) => set((state) => ({
                properties: state.properties.map((p) => p.id === id ? { ...p, status } : p)
            })),

            // 🚀 ฟังก์ชันลบข้อมูล (ออโต้ดึง IP เครื่อง)
            deleteProperty: async (id, userId, role) => {
                const property = get().properties.find(p => p.id === id);
                if (role === 'ADMIN' || property?.userId === userId) {
                    try {
                        const currentIP = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
                        const res = await fetch(`http://${currentIP}:5000/api/properties/${id}`, {
                            method: 'DELETE'
                        });
                        
                        if (res.ok) {
                            set((state) => ({ properties: state.properties.filter((p) => p.id !== id) }));
                        } else {
                            alert("ไม่สามารถลบข้อมูลจากฐานข้อมูลได้");
                        }
                    } catch (err) {
                        console.error("Delete failed", err);
                    }
                } else {
                    alert('คุณไม่มีสิทธิ์ลบรายการนี้');
                }
            },

            addToCompare: (id) => {
                const list = get().comparisonList;
                if (list.includes(id)) return;
                if (list.length >= 4) {
                    alert("เปรียบเทียบได้สูงสุด 4 รายการ");
                    return;
                }
                set({ comparisonList: [...list, id] });
            },
            removeFromCompare: (id) => set((state) => ({
                comparisonList: state.comparisonList.filter((item) => item !== id)
            })),
            clearCompareList: () => set({ comparisonList: [] }),
        }),
        { 
            name: 'property-storage',
            partialize: (state) => ({ 
                properties: state.properties, 
                comparisonList: state.comparisonList 
            }),
        }
    )
);