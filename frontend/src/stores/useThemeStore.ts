'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
    themeMode: ThemeMode;
    setThemeMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            themeMode: 'light',
            setThemeMode: (mode) => set({ themeMode: mode }),
        }),
        {
            name: 'homelink-theme-mode-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
