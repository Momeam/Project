import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';

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

export const useInquiryStore = create<InquiryState>((set) => ({
    inquiries: [],
    isLoading: false,
    error: null,

    fetchInquiries: async () => {
        set({ isLoading: true });
        try {
            const token = useAuthStore.getState().token || localStorage.getItem('token');
            const currentIP = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
            const response = await fetch(`http://${currentIP}:5000/api/inquiries`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch inquiries');
            const data = await response.json();
            set({ inquiries: data, isLoading: false });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    }
}));
