'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore'; 
import { useFavoriteStore } from '@/stores/useFavoriteStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Building2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    // 🟢 เรียกใช้ login จาก useAuthStore ตัวใหม่
    const login = useAuthStore((state) => state.login);

    const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement> | React.FormEvent) => {
        e.preventDefault(); 
        setError('');
        setSuccessMsg('');
        setIsLoading(true);

        try {
            // 🟢 ยิง API ไปหา Database จริง (พอร์ต 5000)
            const response = await fetch('/api/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMsg('เข้าสู่ระบบสำเร็จ! กำลังพาท่านไป...');
                
                // 🟢 บันทึกข้อมูลลง Store ตัวใหม่
                login(data.user, data.token);
                
                // โหลดรายการโปรดทันทีหลัง login
                useFavoriteStore.getState().fetchFavorites();

                const userRole = data.user.role; 

                setTimeout(() => {
                    if (userRole === 'ADMIN') {
                        router.push('/admin/users');
                    } else if (userRole === 'SELLER') { 
                        router.push('/user/dashboard');
                    } else {
                        router.push('/');
                    }
                }, 1000);

            } else {
                setError(data.error || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
            }
        } catch (err) {
            console.error('Login Error:', err);
            setError('ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white dark:bg-slate-950 font-sans">
            {/* 🌟 Left Side: Cinematic Image 🌟 */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
                <img 
                    src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop" 
                    className="absolute inset-0 w-full h-full object-cover scale-105 animate-pulse-slow" 
                    alt="Premium Property" 
                    style={{ animationDuration: '30s' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent"></div>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent"></div>
                
                <div className="absolute bottom-0 left-0 right-0 p-16 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium mb-6">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        เครือข่ายอสังหาริมทรัพย์ระดับพรีเมียม
                    </div>
                    <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight">
                        เปิดประตูสู่<br/>วิสัยทัศน์แห่งการอยู่อาศัย
                    </h1>
                    <p className="text-xl text-slate-300 font-light max-w-md leading-relaxed">
                        เข้าสู่ระบบเพื่อจัดการทรัพย์สินและค้นพบบ้านในฝันที่คุณตามหา
                    </p>
                </div>
            </div>

            {/* 🌟 Right Side: Form Content 🌟 */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-16 relative">
                <div className="lg:hidden absolute inset-0 z-0">
                    <img 
                        src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop" 
                        className="w-full h-full object-cover opacity-10 dark:opacity-20" 
                        alt="Background" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-slate-950 dark:via-slate-950/80"></div>
                </div>

                <div className="w-full max-w-md relative z-10 animate-fade-in-up">
                    <Link href="/" className="inline-flex items-center gap-3 group mb-12">
                        <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-2.5 rounded-xl shadow-lg group-hover:scale-105 transition-transform">
                            <Building2 className="w-6 h-6 stroke-[1.5]" />
                        </div>
                        <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                            HomeLink<span className="text-emerald-500">.</span>
                        </span>
                    </Link>

                    <div className="mb-10">
                        <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">ยินดีต้อนรับกลับมา</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-lg">กรุณากรอกอีเมลและรหัสผ่านเพื่อเข้าสู่ระบบ</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">อีเมลแอดเดรส</label>
                            <Input 
                                type="email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                                placeholder="name@example.com" 
                                className="h-14 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 text-base transition-all px-5 shadow-sm" 
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1 pr-1">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">รหัสผ่าน</label>
                                <a href="#" className="font-medium text-sm text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors">ลืมรหัสผ่าน?</a>
                            </div>
                            <Input 
                                type="password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                                placeholder="••••••••" 
                                className="h-14 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 text-base transition-all px-5 shadow-sm" 
                            />
                        </div>
                        
                        {error && <p className="text-sm text-rose-600 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-900/50 p-4 rounded-xl">{error}</p>}
                        {successMsg && <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/50 p-4 rounded-xl">{successMsg}</p>}

                        <div className="pt-4">
                            <Button 
                                type="submit" 
                                disabled={isLoading}
                                className={`w-full h-14 text-lg font-bold rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl ${isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 hover:-translate-y-1'}`}
                            >
                                {isLoading ? 'กำลังตรวจสอบ...' : (
                                    <>เข้าสู่ระบบ <ArrowRight className="w-5 h-5 ml-1" /></>
                                )}
                            </Button>
                        </div>

                        <div className="text-center text-base font-medium text-slate-600 dark:text-slate-400 mt-8 pt-8 border-t border-slate-100 dark:border-slate-800/50">
                            ยังไม่มีบัญชีผู้ใช้งาน? <Link href="/register" className="text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 transition-colors ml-1 font-bold hover:underline underline-offset-4">สร้างบัญชีใหม่</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}