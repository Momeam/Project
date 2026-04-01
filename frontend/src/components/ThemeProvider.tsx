'use client';

import React, { useEffect, useState } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { usePathname } from 'next/navigation';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { themeMode } = useThemeStore();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        // Apply dark mode based on global setting
        if (themeMode === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [themeMode, mounted]);

    // Prevent hydration mismatch
    if (!mounted) return <>{children}</>;

    return <>{children}</>;
}
