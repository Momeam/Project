'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from "@/components/ui/button";
import { LogOut, User, Building2, LayoutDashboard, Settings, UserPlus, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NotificationCenter from '@/components/NotificationCenter';

export default function Navbar() {
    const [isMounted, setIsMounted] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    
    // 🟢 เปลี่ยนชื่อตัวแปรให้ตรงกับ useAuthStore
    const isLoggedIn = useAuthStore((state) => state.isAuthenticated);
    const currentUser = useAuthStore((state) => state.user);
    const role = currentUser?.role;
    const logout = useAuthStore((state) => state.logout);

    useEffect(() => {
        setIsMounted(true);
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
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
        <nav className={`fixed w-full z-50 transition-all duration-300 border-b ${
            scrolled 
            ? 'bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-white/20 dark:border-slate-800/50 shadow-sm' 
            : 'bg-transparent border-transparent'
        }`}>
            <div className="container mx-auto px-6 h-24 flex items-center justify-between">
                
                {/* โลโก้ */}
                <Link href="/" className="flex items-center gap-3 group bg-white/60 dark:bg-slate-900/50 backdrop-blur-md py-2 px-3.5 rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-sm transition-all hover:bg-white/80 dark:hover:bg-slate-900/80">
                    <div className="bg-gradient-to-br from-emerald-500 to-cyan-600 text-white p-2.5 rounded-xl shadow-lg shadow-emerald-500/20 group-hover:shadow-cyan-500/40 transition-all duration-500 transform group-hover:scale-105">
                        <Building2 className="w-6 h-6 stroke-[1.5]" />
                    </div>
                    <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 tracking-tighter pr-1">
                        HomeLink<span className="text-emerald-500 drop-shadow-sm">.</span>
                    </span>
                </Link>

                {/* เมนูตรงกลาง */}
                <div className="hidden md:flex items-center gap-1 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-1.5 rounded-full border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                    <Link href="/" className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${pathname === '/' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-800/40'}`}>หน้าแรก</Link>
                    <Link href="/buy" className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${pathname === '/buy' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-800/40'}`}>ซื้อ</Link>
                    <Link href="/rent" className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${pathname === '/rent' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-800/40'}`}>เช่า</Link>
                    <Link href="/sellers" className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${pathname.startsWith('/sellers') ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-800/40'}`}>ค้นหาผู้ขาย</Link>
                    {isLoggedIn && (
                        <Link href="/my-properties" className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${pathname === '/my-properties' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-800/40'}`}>
                            รายการโปรด
                        </Link>
                    )}
                </div>

                {/* เมนูขวา */}
                <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-900/50 backdrop-blur-md p-1.5 rounded-full border border-white/50 dark:border-slate-700/50 shadow-sm">
                    {isMounted && (
                        isLoggedIn ? (
                            <>
                                <NotificationCenter />
                                
                                {role === 'USER' && (
                                    <Link href="/user/dashboard">
                                        <Button variant="default" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white gap-2 font-bold rounded-full px-5 hidden md:flex transition-all shadow-md hover:shadow-lg border border-emerald-400/20 hover:scale-105">
                                            <UserPlus className="w-4 h-4" /> สมัครเป็นผู้ขาย
                                        </Button>
                                    </Link>
                                )}

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="text-slate-800 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/50 gap-2 font-bold rounded-full pl-5 pr-4 hidden sm:flex transition-colors">
                                            {role === 'SELLER' ? <LayoutDashboard className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                            {getMenuLabel()}
                                            <ChevronDown className="w-4 h-4 ml-1 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-2xl rounded-2xl p-2 font-medium mt-2">
                                        <DropdownMenuLabel className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400 flex flex-col gap-1">
                                            <span>เข้าสู่ระบบในชื่อ</span>
                                            <strong className="text-sm text-slate-900 dark:text-white truncate">{currentUser?.email}</strong>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 mx-2" />
                                        
                                        <DropdownMenuItem asChild className="rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 focus:bg-slate-50 dark:focus:bg-slate-800 p-3">
                                            <Link href={getMenuLink()} className="flex items-center gap-3 w-full">
                                                {role === 'SELLER' ? <LayoutDashboard className="w-4 h-4 text-emerald-500" /> : <User className="w-4 h-4 text-emerald-500" />}
                                                <span>{getMenuLabel()}</span>
                                            </Link>
                                        </DropdownMenuItem>

                                        <DropdownMenuItem asChild className="rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 focus:bg-slate-50 dark:focus:bg-slate-800 p-3">
                                            <Link href="/user/profile" className="flex items-center gap-3 w-full">
                                                <Settings className="w-4 h-4 text-slate-500" />
                                                <span>ตั้งค่าบัญชี</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        
                                        <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 mx-2" />
                                        <DropdownMenuItem onClick={handleLogout} className="rounded-xl cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-950/30 focus:bg-rose-50 dark:focus:bg-rose-950/30 text-rose-600 dark:text-rose-500 p-3">
                                            <div className="flex items-center gap-3 w-full">
                                                <LogOut className="w-4 h-4" />
                                                <span>ออกจากระบบ</span>
                                            </div>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        ) : (
                            <>
                                <Link href="/login" className="hidden sm:block">
                                    <Button variant="ghost" className="text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800 font-bold rounded-full px-6 transition-colors">เข้าสู่ระบบ</Button>
                                </Link>
                                <Link href="/register">
                                    <Button className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-white dark:to-slate-200 hover:from-slate-800 hover:to-slate-700 dark:hover:from-slate-100 dark:hover:to-white text-white dark:text-slate-900 rounded-full px-6 py-5 shadow-lg shadow-slate-900/20 dark:shadow-white/10 transition-all hover:scale-105 hover:shadow-xl font-bold border border-transparent">
                                        ลงทะเบียนผู้ขาย
                                    </Button>
                                </Link>
                            </>
                        )
                    )}
                </div>
            </div>
        </nav>
    );
}