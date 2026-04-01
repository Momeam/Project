'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User as UserIcon, Shield, Key, CheckCircle, Save, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ProfilePage() {
    const { currentUser, updateProfile, changePassword } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'theme'>('profile');
    const { themeMode, setThemeMode } = useThemeStore();
    
    // Profile State
    const [profileForm, setProfileForm] = useState({
        username: currentUser?.username || '',
        tel: currentUser?.tel || '',
        line_id: currentUser?.line_id || ''
    });

    // Password State
    const [passwordForm, setPasswordForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [isUpdating, setIsUpdating] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (currentUser) {
            setProfileForm({
                username: currentUser.username || '',
                tel: currentUser.tel || '',
                line_id: currentUser.line_id || ''
            });
        }
    }, [currentUser]);

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);
        setMessage(null);

        const result = await updateProfile(profileForm);
        if (result.success) {
            setMessage({ type: 'success', text: 'อัปเดตข้อมูลโปรไฟล์สำเร็จ 🎉' });
        } else {
            setMessage({ type: 'error', text: result.error || 'ไม่สามารถอัปเดตข้อมูลได้' });
        }
        setIsUpdating(false);
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            return setMessage({ type: 'error', text: 'รหัสผ่านใหม่ไม่ตรงกัน' });
        }

        setIsUpdating(true);
        const result = await changePassword({
            oldPassword: passwordForm.oldPassword,
            newPassword: passwordForm.newPassword
        });

        if (result.success) {
            setMessage({ type: 'success', text: 'เปลี่ยนรหัสผ่านสำเร็จ ✅' });
            setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } else {
            setMessage({ type: 'error', text: result.error || 'ไม่สามารถเปลี่ยนรหัสผ่านได้' });
        }
        setIsUpdating(false);
    };

    return (
        <div className="max-w-4xl mx-auto px-4 pb-20 transition-colors duration-500">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 transition-colors">ตั้งค่าบัญชี</h1>
                <p className="text-slate-500 dark:text-slate-400 transition-colors">จัดการข้อมูลส่วนตัวและความปลอดภัยของบัญชีคุณ</p>
            </div>

            {message && (
                <Alert className={`mb-6 transition-all ${message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20'}`}>
                    {message.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                    <AlertTitle className={message.type === 'success' ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'}>
                        {message.type === 'success' ? 'สำเร็จ' : 'แจ้งเตือน'}
                    </AlertTitle>
                    <AlertDescription className={message.type === 'success' ? 'text-emerald-700 dark:text-emerald-400/80' : 'text-rose-700 dark:text-rose-400/80'}>
                        {message.text}
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="space-y-1">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                            activeTab === 'profile' 
                            ? 'bg-slate-100 text-slate-900 shadow-lg shadow-slate-200/50' 
                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                        <UserIcon className="w-4 h-4 mr-3" />
                        ข้อมูลโปรไฟล์
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                            activeTab === 'security' 
                            ? 'bg-slate-100 text-slate-900 shadow-lg shadow-slate-200/50' 
                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                        <Shield className="w-4 h-4 mr-3" />
                        ความปลอดภัย
                    </button>
                    <button
                        onClick={() => setActiveTab('theme')}
                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                            activeTab === 'theme' 
                            ? 'bg-slate-100 text-slate-900 shadow-lg shadow-slate-200/50' 
                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                        <AlertCircle className="w-4 h-4 mr-3" />
                        ตั้งค่าธีมสี
                    </button>
                </div>

                {/* Content Area */}
                <div className="md:col-span-3">
                    {activeTab === 'profile' ? (
                        <Card className="border border-slate-100 dark:border-white/10 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-[#121217] transition-colors">
                            <CardHeader className="bg-slate-50/50 dark:bg-white/[0.03] border-b border-slate-100 dark:border-white/5">
                                <CardTitle className="dark:text-white">ข้อมูลส่วนตัว</CardTitle>
                                <CardDescription className="dark:text-slate-400">อีเมลของคุณคือ {currentUser?.email}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                <form onSubmit={handleProfileSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="username" className="dark:text-slate-300">ชื่อผู้ใช้ (Username)</Label>
                                        <Input 
                                            id="username" 
                                            value={profileForm.username}
                                            onChange={(e) => setProfileForm({...profileForm, username: e.target.value})}
                                            className="rounded-xl h-11 bg-white dark:bg-[#1a1a20] border-slate-200 dark:border-white/10 dark:text-white"
                                            placeholder="กรอกชื่อผู้ใช้"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="tel" className="dark:text-slate-300">เบอร์โทรศัพท์</Label>
                                        <Input 
                                            id="tel" 
                                            value={profileForm.tel}
                                            onChange={(e) => setProfileForm({...profileForm, tel: e.target.value})}
                                            className="rounded-xl h-11 bg-white dark:bg-[#1a1a20] border-slate-200 dark:border-white/10 dark:text-white"
                                            placeholder="08X-XXX-XXXX"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="line_id" className="dark:text-slate-300">Line ID</Label>
                                        <Input 
                                            id="line_id" 
                                            value={profileForm.line_id}
                                            onChange={(e) => setProfileForm({...profileForm, line_id: e.target.value})}
                                            className="rounded-xl h-11 bg-white dark:bg-[#1a1a20] border-slate-200 dark:border-white/10 dark:text-white"
                                            placeholder="Your Line ID"
                                        />
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">สถานะบัญชี</h4>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                currentUser?.role === 'ADMIN' ? 'bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400' :
                                                currentUser?.role === 'SELLER' ? 'bg-sky-100 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400'
                                            }`}>
                                                {currentUser?.role === 'ADMIN' ? 'ADMIN' : currentUser?.role === 'SELLER' ? 'SELLER (ยืนยันแล้ว)' : 'USER'}
                                            </span>
                                        </div>
                                    </div>

                                    <Button 
                                        type="submit" 
                                        disabled={isUpdating}
                                        className="w-full bg-slate-900 dark:bg-white hover:bg-black dark:hover:bg-slate-200 text-white dark:text-slate-900 h-12 rounded-xl text-base font-medium shadow-lg transition-all"
                                    >
                                        {isUpdating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                                        บันทึกการเปลี่ยนแปลง
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    ) : activeTab === 'theme' ? (
                        <Card className="border border-slate-100 dark:border-white/10 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-[#121217] transition-colors">
                            <CardHeader className="bg-slate-50/50 dark:bg-white/[0.03] border-b border-slate-100 dark:border-white/5">
                                <CardTitle className="dark:text-white">โหมดกลางวัน / กลางคืน</CardTitle>
                                <CardDescription className="dark:text-slate-400">เลือกการแสดงผลที่คุณต้องการใช้งาน (การตั้งค่านี้จะมีผลกับทุกหน้า รวมถึงหน้า Admin)</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { id: 'light', name: 'โหมดสว่าง (Light Mode)', icon: UserIcon, desc: 'สะอาดตา เหมาะกับการใช้งานทั่วไป' },
                                        { id: 'dark', name: 'โหมดมืด (Dark Mode)', icon: Shield, desc: 'ถนอมสายตา และช่วยประหยัดพลังงาน' },
                                    ].map((m) => (
                                        <button
                                            key={m.id}
                                            onClick={() => setThemeMode(m.id as any)}
                                            className={`flex flex-col items-start p-6 rounded-2xl border-2 transition-all text-left ${
                                                themeMode === m.id 
                                                ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl' 
                                                : 'border-slate-100 dark:border-white/10 hover:border-slate-200 dark:hover:border-white/20 bg-white dark:bg-[#1a1a20] text-slate-900 dark:text-white'
                                            }`}
                                        >
                                            <m.icon className={`w-8 h-8 mb-4 ${themeMode === m.id ? 'text-white dark:text-slate-900' : 'text-slate-400'}`} />
                                            <h4 className="text-lg font-bold mb-1">{m.name}</h4>
                                            <p className={`text-sm ${themeMode === m.id ? 'text-slate-400 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'}`}>{m.desc}</p>
                                            
                                            {themeMode === m.id && (
                                                <div className="mt-4 bg-white/20 dark:bg-black/10 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                                                    <CheckCircle className="w-3 h-3" /> ใช้งานอยู่ตอนนี้
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border border-slate-100 dark:border-white/10 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-[#121217] transition-colors">
                            <CardHeader className="bg-slate-50/50 dark:bg-white/[0.03] border-b border-slate-100 dark:border-white/5">
                                <CardTitle className="dark:text-white">เปลี่ยนรหัสผ่าน</CardTitle>
                                <CardDescription className="dark:text-slate-400">เพื่อความปลอดภัยกรุณาใช้รหัสผ่านที่คาดเดายาก</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="oldPassword" className="dark:text-slate-300">รหัสผ่านปัจจุบัน</Label>
                                        <div className="relative">
                                            <Key className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                                            <Input 
                                                id="oldPassword" 
                                                type="password"
                                                value={passwordForm.oldPassword}
                                                onChange={(e) => setPasswordForm({...passwordForm, oldPassword: e.target.value})}
                                                className="pl-10 rounded-xl h-11 bg-white dark:bg-[#1a1a20] border-slate-200 dark:border-white/10 dark:text-white"
                                                placeholder="••••••••"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="newPassword" className="dark:text-slate-300">รหัสผ่านใหม่</Label>
                                        <div className="relative">
                                            <Key className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                                            <Input 
                                                id="newPassword" 
                                                type="password"
                                                value={passwordForm.newPassword}
                                                onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                                                className="pl-10 rounded-xl h-11 bg-white dark:bg-[#1a1a20] border-slate-200 dark:border-white/10 dark:text-white"
                                                placeholder="••••••••"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword" className="dark:text-slate-300">ยืนยันรหัสผ่านใหม่</Label>
                                        <div className="relative">
                                            <Key className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                                            <Input 
                                                id="confirmPassword" 
                                                type="password"
                                                value={passwordForm.confirmPassword}
                                                onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                                                className="pl-10 rounded-xl h-11 bg-white dark:bg-[#1a1a20] border-slate-200 dark:border-white/10 dark:text-white"
                                                placeholder="••••••••"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <Button 
                                        type="submit" 
                                        disabled={isUpdating}
                                        className="w-full bg-slate-900 dark:bg-white hover:bg-black dark:hover:bg-slate-200 text-white dark:text-slate-900 h-12 rounded-xl text-base font-medium shadow-lg transition-all"
                                    >
                                        {isUpdating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Shield className="w-5 h-5 mr-2" />}
                                        อัปเดตรหัสผ่าน
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
