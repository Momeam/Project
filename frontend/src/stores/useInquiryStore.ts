import { create } from 'zustand';
import { authFetch, getAuthHeaders } from '@/lib/authFetch';

export interface Inquiry {
    id: string;
    sender_id: string;
    receiver_id: string;
    property_id: string;
    message: string;
    createdAt: string;
    sender_name?: string;
    sender_tel?: string;
    sender_email?: string;
    property_title?: string;
}

interface InquiryState {
    inquiries: Inquiry[];
    isLoading: boolean;
    error: string | null;

    fetchInquiries: () => Promise<void>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || `/api`;

export const useInquiryStore = create<InquiryState>((set) => ({
    inquiries: [],
    isLoading: false,
    error: null,

    fetchInquiries: async () => {
        set({ isLoading: true });
        try {
            const response = await authFetch(`${API_URL}/inquiries`, {
                headers: getAuthHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch inquiries');
            const data = await response.json();
            set({ inquiries: data, isLoading: false });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    }
}));
