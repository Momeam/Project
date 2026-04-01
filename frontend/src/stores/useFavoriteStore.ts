import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';

interface FavoriteState {
    favoriteIds: Set<string>;
    fetchFavorites: () => Promise<void>;
    toggleFavorite: (propertyId: string) => Promise<void>;
    clearFavorites: () => void;
}

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
    favoriteIds: new Set(),

    fetchFavorites: async () => {
        const token = useAuthStore.getState().token || localStorage.getItem('token');
        if (!token) return;

        try {
            const currentIP = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
            const response = await fetch(`http://${currentIP}:5000/api/favorites`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const favorites = await response.json();
                const ids = new Set(favorites.map((fav: any) => fav.id));
                set({ favoriteIds: ids });
            }
        } catch (error) {
            console.error("Failed to fetch favorites:", error);
        }
    },

    toggleFavorite: async (propertyId: string) => {
        const token = useAuthStore.getState().token || localStorage.getItem('token');
        if (!token) {
            alert('กรุณาเข้าสู่ระบบเพื่อบันทึกรายการโปรด');
            return;
        }

        const { favoriteIds } = get();
        const newFavoriteIds = new Set(favoriteIds);
        const currentIP = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
        let method = '';

        if (newFavoriteIds.has(propertyId)) {
            newFavoriteIds.delete(propertyId);
            method = 'DELETE';
        } else {
            newFavoriteIds.add(propertyId);
            method = 'POST';
        }

        set({ favoriteIds: newFavoriteIds }); // Optimistic update

        try {
            const url = method === 'DELETE' 
                ? `http://${currentIP}:5000/api/favorites/${propertyId}` 
                : `http://${currentIP}:5000/api/favorites`;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: method === 'POST' ? JSON.stringify({ property_id: propertyId }) : undefined,
            });

            if (!response.ok) {
                // Revert on failure
                set({ favoriteIds });
                const data = await response.json();
                alert(data.error || 'เกิดข้อผิดพลาดในการอัปเดตรายการโปรด');
            }
        } catch (error) {
            // Revert on failure
            set({ favoriteIds });
            console.error("Failed to toggle favorite:", error);
        }
    },

    clearFavorites: () => {
        set({ favoriteIds: new Set() });
    },
}));
