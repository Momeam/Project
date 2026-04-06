'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Building2, UserPlus, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [tel, setTel] = useState(''); 
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false); 
    const router = useRouter();
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch(`/api/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    tel
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert('สมัครสมาชิกสำเร็จ! 🎉 ระบบกำลังพาท่านไปหน้าเข้าสู่ระบบ...');
                router.push('/login');
            } else {
                setError(data.error || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
            }
        } catch (err) {
            console.error('Error:', err);
            setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบ Backend');
        } finally {
            setIsLoading(false); 
        }
    };

    return (
        <div className="min-h-screen flex bg-white dark:bg-slate-950 font-sans">
            
            {/* 🌟 Left Side: Form Content 🌟 */}
            <div className="w-full lg:w-[55%] flex items-center justify-center p-8 sm:p-12 lg:p-16 relative">
                
                {/* Mobile Background Overlay */}
                <div className="lg:hidden absolute inset-0 z-0">
                    <img 
                        src="https://images.unsplash.com/photo-1545083036-74fcce58bdfe?q=80&w=2070&auto=format&fit=crop" 
                        className="w-full h-full object-cover opacity-10 dark:opacity-20" 
                        alt="Background" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-slate-950 dark:via-slate-950/80"></div>
                </div>

                <div className="w-full max-w-md relative z-10 animate-fade-in-up">
                    <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mb-8 group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        กลับสู่หน้าหลัก
                    </Link>

                    <div className="mb-10">
                        <div className="inline-flex items-center gap-3 mb-6">
                            <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-2.5 rounded-xl shadow-lg">
                                <Building2 className="w-6 h-6 stroke-[1.5]" />
                            </div>
                            <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                                HomeLink<span className="text-cyan-500">.</span>
                            </span>
                        </div>
                        <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">สร้างบัญชีผู้ใช้ใหม่</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-lg">เริ่มต้นสู่การเป็นส่วนหนึ่งของเครือข่ายอสังหาริมทรัพย์ระดับพรีเมียม</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">ชื่อผู้ใช้</label>
                                <Input 
                                    type="text" 
                                    value={username} 
                                    onChange={(e) => setUsername(e.target.value)} 
                                    required 
                                    placeholder="Username" 
                                    className="h-14 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500 text-base transition-all px-5 shadow-sm" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">เบอร์โทรศัพท์</label>
                                <Input 
                                    type="tel" 
                                    value={tel} 
                                    onChange={(e) => setTel(e.target.value)} 
                                    placeholder="08X-XXX-XXXX" 
                                    className="h-14 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500 text-base transition-all px-5 shadow-sm" 
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">อีเมลแอดเดรส</label>
                            <Input 
                                type="email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                                placeholder="name@example.com" 
                                className="h-14 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500 text-base transition-all px-5 shadow-sm" 
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">รหัสผ่าน</label>
                            <Input 
                                type="password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                                placeholder="ตั้งรหัสผ่านอย่างน้อย 6 ตัวอักษร" 
                                className="h-14 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500 text-base transition-all px-5 shadow-sm" 
                                minLength={6}
                            />
                        </div>
                        
                        {error && <p className="text-sm text-rose-600 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-900/50 p-4 rounded-xl">{error}</p>}

                        <div className="pt-4">
                            <Button 
                                type="submit" 
                                disabled={isLoading} 
                                className={`w-full h-14 text-lg font-bold rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl ${isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-slate-900 to-slate-800 dark:from-white dark:to-slate-200 text-white dark:text-slate-900 hover:-translate-y-1'}`}
                            >
                                {isLoading ? 'กำลังประมวลผล...' : (
                                    <>สมัครสมาชิก <UserPlus className="w-5 h-5 ml-1" /></>
                                )}
                            </Button>
                        </div>
                        
                        <div className="text-center text-base font-medium text-slate-600 dark:text-slate-400 mt-8 pt-8 border-t border-slate-100 dark:border-slate-800/50">
                            มีบัญชีผู้ใช้งานอยู่แล้ว? <Link href="/login" className="text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 transition-colors ml-1 font-bold hover:underline underline-offset-4">เข้าสู่ระบบ</Link>
                        </div>
                    </form>
                </div>
            </div>

            {/* 🌟 Right Side: Cinematic Image 🌟 */}
            <div className="hidden lg:flex lg:w-[45%] relative bg-slate-900 overflow-hidden">
                <img 
                    src="https://images.unsplash.com/photo-1545083036-74fcce58bdfe?q=80&w=2070&auto=format&fit=crop" 
                    className="absolute inset-0 w-full h-full object-cover scale-105 animate-pulse-slow transform -scale-x-100" 
                    alt="Premium Property Architecture" 
                    style={{ animationDuration: '40s' }}
                />
                {/* Gradients to make text readable and blend edges */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/30 to-transparent"></div>
                
                <div className="absolute bottom-0 left-0 right-0 p-16 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium mb-6">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                        สมัครใช้งานฟรี ไม่มีค่าใช้จ่ายแอบแฝง
                    </div>
                    <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight drop-shadow-lg">
                        ลงประกาศง่ายๆ<br/>เข้าถึงผู้ซื้อตัวจริง
                    </h1>
                    <p className="text-xl text-slate-300 font-light max-w-md leading-relaxed drop-shadow-md">
                        เข้าร่วมกับแพลตฟอร์มของเราเพื่อขยายโอกาสในการขายหรือเช่าอสังหาฯ ของคุณ
                    </p>
                </div>
            </div>

        </div>
    );
}