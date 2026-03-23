import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AdBanner {
    id: string;
    imageUrl: string;
    linkUrl: string;
    position: 'TOP_BANNER' | 'SIDEBAR'; 
    isActive: boolean;
}

interface AdState {
    ads: AdBanner[];
    addAd: (ad: Omit<AdBanner, 'id'>) => void;
    deleteAd: (id: string) => void;
    toggleAdStatus: (id: string) => void;
}

export const useAdStore = create<AdState>()(
    persist(
        (set) => ({
            ads: [
                // Mockup โฆษณาตัวอย่าง
                { 
                    id: 'ad_demo', 
                    imageUrl: 'https://placehold.co/1200x250/1e293b/ffffff?text=Exclusive+Property+Showcase', 
                    linkUrl: '#', 
                    position: 'TOP_BANNER', 
                    isActive: true 
                }
            ],
            addAd: (ad) => set((state) => ({ 
                ads: [...state.ads, { ...ad, id: `ad_${Date.now()}` }] 
            })),
            deleteAd: (id) => set((state) => ({ 
                ads: state.ads.filter(ad => ad.id !== id) 
            })),
            toggleAdStatus: (id) => set((state) => ({
                ads: state.ads.map(ad => ad.id === id ? { ...ad, isActive: !ad.isActive } : ad)
            })),
        }),
        { name: 'ad-storage' }
    )
);