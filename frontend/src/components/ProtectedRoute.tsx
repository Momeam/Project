'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const router = useRouter();
    const { isAuthenticated, currentUser, refreshUser, _hasHydrated } = useAuthStore();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkAccess = async () => {
            // รอจนกว่าข้อมูลจาก Store ในเครื่องจะถูกโหลดเสร็จ (Wait for Hydration)
            if (!_hasHydrated) {
                console.log('ProtectedRoute: Waiting for hydration...');
                return;
            }

            console.log(`ProtectedRoute: Checked ID: ${currentUser?.id}, Auth: ${isAuthenticated}, Role: "${currentUser?.role}"`);

            if (!isAuthenticated) {
                console.log('ProtectedRoute: User not authenticated, redirecting to login...');
                router.push('/login');
                return;
            }

            // ถ้ามี allowedRoles และ Role ปัจจุบันไม่ตรง ให้ลองรีเฟรชข้อมูลจาก DB ล่าสุดก่อน
            if (allowedRoles) {
                console.log(`ProtectedRoute: Page requires roles: ${allowedRoles}. Current user role: "${currentUser?.role}"`);
                
                if (currentUser && !allowedRoles.includes(currentUser.role) && currentUser.role !== 'ADMIN') {
                    console.log('ProtectedRoute: Role mismatch detected. Calling refreshUser()...');
                    await refreshUser();
                    
                    const latestUser = useAuthStore.getState().currentUser;
                    console.log(`ProtectedRoute: After sync, Role is: "${latestUser?.role}"`);

                    if (latestUser && latestUser.role !== 'ADMIN' && !allowedRoles.includes(latestUser.role)) {
                        console.log('ProtectedRoute: Access still DENIED after sync. Redirecting to home...');
                        router.push('/'); 
                        return;
                    }
                    console.log('ProtectedRoute: Access GRANTED after sync.');
                }
            }

            setIsChecking(false);
        };

        checkAccess();
    }, [_hasHydrated, isAuthenticated, currentUser?.id, currentUser?.role, allowedRoles, router, refreshUser]);



    if (isChecking || !_hasHydrated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
                    <p className="text-slate-500 font-medium animate-pulse">กำลังตรวจสอบสิทธิ์การเข้าถึง...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}