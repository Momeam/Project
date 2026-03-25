'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from "@/components/ui/button";
import { LogOut, User, Building2, LayoutDashboard } from 'lucide-react';
import NotificationCenter from '@/components/NotificationCenter'; // 👈 นำเข้า NotificationCenter

export default function Navbar() {
    const [isMounted, setIsMounted] = useState(false); // ⭐️ 1. เพิ่ม State เช็กการโหลด
    const pathname = usePathname();
    const router = useRouter();
    
    const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
    const currentUser = useAuthStore((state) => state.currentUser);
    const role = currentUser?.role;
    const logout = useAuthStore((state) => state.logout);

    // ⭐️ 2. สั่งให้หน่วงเวลาตอนโหลดครั้งแรก ป้องกันเว็บค้าง
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const getMenuLabel = () => {
        if (role === 'ADMIN') return 'ผู้ดูแลระบบ';
        if (role === 'SELLER') return 'ระบบผู้ขาย';
        return 'บัญชีของฉัน';
    };

    const getMenuLink = () => {
        if (role === 'ADMIN') return '/admin/users';
        return '/user/dashboard';
    };

    if (pathname === '/login' || pathname === '/register') return null;

    return (
        <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
            <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                
                {/* โลโก้ */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="bg-slate-900 text-white p-2 rounded-lg group-hover:bg-slate-800 transition-colors">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <span className="text-2xl font-bold text-slate-900 tracking-tight font-serif">
                        HomeLink<span className="text-emerald-600">.</span>
                    </span>
                </Link>

                {/* เมนูตรงกลาง */}
                <div className="hidden md:flex items-center gap-8">
                    <Link href="/" className={`text-sm font-medium transition-colors hover:text-slate-900 ${pathname === '/' ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>หน้าแรก</Link>
                    <Link href="/buy" className={`text-sm font-medium transition-colors hover:text-slate-900 ${pathname === '/buy' ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>ซื้อ</Link>
                    <Link href="/rent" className={`text-sm font-medium transition-colors hover:text-slate-900 ${pathname === '/rent' ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>เช่า</Link>
                    <Link href="/sellers" className={`text-sm font-medium transition-colors hover:text-slate-900 ${pathname.startsWith('/sellers') ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>ค้นหาผู้ขาย</Link>
                </div>

                {/* เมนูขวา */}
                <div className="flex items-center gap-4">
                    {/* ⭐️ 3. ซ่อนปุ่มเมนูไว้ก่อนจนกว่าเว็บจะ Hydrate เสร็จ ป้องกัน JS พัง */}
                    {isMounted && (
                        isLoggedIn ? (
                            <>
                                <NotificationCenter /> {/* 🔔 แสดงกระดิ่งแจ้งเตือนที่นี่ */}
                                <Link href={getMenuLink()}>
                                    <Button variant="ghost" className="text-slate-600 hover:text-slate-900 hover:bg-slate-50 gap-2 font-medium">
                                        {role === 'SELLER' ? <LayoutDashboard className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                        {getMenuLabel()}
                                    </Button>
                                </Link>
                                <Button variant="outline" onClick={handleLogout} className="border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all gap-2">
                                    <LogOut className="w-4 h-4" /> ออกจากระบบ
                                </Button>
                            </>
                        ) : (
                            <>
                                <Link href="/login">
                                    <Button variant="ghost" className="text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium">เข้าสู่ระบบ</Button>
                                </Link>
                                <Link href="/register">
                                    <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-6 shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5">สมัครสมาชิก</Button>
                                </Link>
                            </>
                        )
                    )}
                </div>
            </div>
        </nav>
    );
}