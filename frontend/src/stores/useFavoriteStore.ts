import { create } from 'zustand';
import { authFetch, getAuthHeaders } from '@/lib/authFetch';

const API_URL = process.env.NEXT_PUBLIC_API_URL || `/api`;

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
        const headers = getAuthHeaders();
        if (!headers['Authorization']) return;

        try {
            const response = await authFetch(`${API_URL}/favorites`, { headers });
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
        const headers = getAuthHeaders();
        if (!headers['Authorization']) {
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

            const response = await authFetch(url, {
                method: isCurrentlyFavorite ? 'DELETE' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...headers,
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

