import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface FavoriteState {
    favoriteIds: string[];
    fetchFavorites: () => Promise<void>;
    toggleFavorite: (propertyId: string) => Promise<void>;
    isFavorite: (propertyId: string) => boolean;
    clearFavorites: () => void;
}

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
    favoriteIds: [],

    fetchFavorites: async () => {
        const token = useAuthStore.getState().token || localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/favorites`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const favorites = await response.json();
                // The API returns full property objects - extract the IDs
                const ids = favorites.map((fav: any) => String(fav.id));
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
        const pid = String(propertyId);
        const isCurrentlyFavorite = favoriteIds.includes(pid);

        // Optimistic update
        if (isCurrentlyFavorite) {
            set({ favoriteIds: favoriteIds.filter(id => id !== pid) });
        } else {
            set({ favoriteIds: [...favoriteIds, pid] });
        }

        try {
            const url = isCurrentlyFavorite
                ? `${API_URL}/favorites/${propertyId}`
                : `${API_URL}/favorites`;

            const response = await fetch(url, {
                method: isCurrentlyFavorite ? 'DELETE' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: !isCurrentlyFavorite ? JSON.stringify({ property_id: propertyId }) : undefined,
            });

            if (!response.ok) {
                // Revert on failure
                set({ favoriteIds });
                const data = await response.json();
                console.error('Toggle favorite failed:', data.error);
            }
        } catch (error) {
            // Revert on failure
            set({ favoriteIds });
            console.error("Failed to toggle favorite:", error);
        }
    },

    isFavorite: (propertyId: string) => {
        return get().favoriteIds.includes(String(propertyId));
    },

    clearFavorites: () => {
        set({ favoriteIds: [] });
    },
}));
