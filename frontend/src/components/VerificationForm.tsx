'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import { Mail, Send, Loader2, Key, User, Smartphone, CreditCard, ArrowLeft } from 'lucide-react';

export default function VerificationForm() {
    const user = useAuthStore((state) => state.user);
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    
    // ตั้งค่าเริ่มต้นของฟอร์ม (ดึง email จาก user ถ้ามี)
    const [formData, setFormData] = useState({
        firstName: '', 
        lastName: '', 
        idCard: '', 
        tel: '', 
        otp: '', 
        email: user?.email || ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 📩 ฟังก์ชันกดปุ่ม "ส่งรหัส OTP เข้าเมล"
    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.email) return alert('กรุณากรอกอีเมล');

        // 🛡️ ดักจับรูปแบบอีเมลปลอม (Regex Validation)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            return alert('รูปแบบอีเมลไม่ถูกต้องครับ (ต้องมี @ และ .com หรือ .co.th)');
        }
        
        setIsLoading(true);
        try {
            // ยิงไปที่ Backend เพื่อส่งเมล์
            const res = await fetch('http://localhost:5000/api/otp/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email }) // 🎯 ส่งอีเมลที่กรอกไป
            });

            if (res.ok) {
                setStep(2);
                alert(`ระบบส่งรหัส 6 หลักไปที่ ${formData.email} แล้วครับ! (อย่าลืมเช็คใน Junk/Spam ด้วยนะ)`);
            } else {
                const data = await res.json();
                alert(data.error || 'เกิดข้อผิดพลาดในการส่งอีเมล');
            }
        } catch (error) {
            alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ Backend (พอร์ต 5000) ได้');
        } finally {
            setIsLoading(false);
        }
    };

    // ✅ ฟังก์ชันกดปุ่ม "ยืนยันรหัส"
    const handleVerify = async () => {
        if (formData.otp.length !== 6) return alert('กรุณากรอกรหัส OTP ให้ครบ 6 หลัก');

        setIsLoading(true);
        try {
            // ยิง API ไปอัปเกรด Role พร้อมตรวจ OTP
            const res = await fetch(`http://localhost:5000/api/users/upgrade/${user?.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    otp: formData.otp,
                    email: formData.email,
                    tel: formData.tel,
                    realName: `${formData.firstName} ${formData.lastName}`
                })
            });

            if (res.ok) {
                // อัปเดตสถานะในแอปทันที! เป็น SELLER แล้ว
                useAuthStore.setState((state) => ({
                    user: state.user ? { ...state.user, role: 'SELLER', tel: formData.tel } : null,
                    justUpgraded: true // เด้งป๊อปอัปฉลอง!
                }));
            } else {
                const data = await res.json();
                alert(data.error || 'รหัส OTP ไม่ถูกต้อง!');
            }
        } catch (error) {
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto p-8 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800">
            {step === 1 ? (
                <form onSubmit={handleRequestOtp} className="space-y-5">
                    <div className="text-center mb-6">
                        <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <User className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white">ยืนยันตัวตนผู้ขาย</h2>
                    </div>
                    
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">อีเมลสำหรับรับ OTP</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input name="email" value={formData.email} onChange={handleChange} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" placeholder="example@gmail.com" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <input name="firstName" placeholder="ชื่อจริง" onChange={handleChange} className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" required />
                        <input name="lastName" placeholder="นามสกุล" onChange={handleChange} className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" required />
                    </div>

                    <div className="space-y-1.5">
                        <div className="relative">
                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input name="idCard" placeholder="เลขบัตรประชาชน 13 หลัก" maxLength={13} onChange={handleChange} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" required />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <div className="relative">
                            <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input name="tel" placeholder="เบอร์โทรศัพท์ 10 หลัก" maxLength={10} onChange={handleChange} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" required />
                        </div>
                    </div>

                    <Button type="submit" disabled={isLoading} className="w-full py-7 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95">
                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>รับรหัส OTP ทางอีเมล <Send className="w-4 h-4 ml-2" /></>}
                    </Button>
                </form>
            ) : (
                <div className="space-y-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-3xl">
                        <Key className="w-10 h-10 mx-auto text-blue-600 mb-2" />
                        <p className="font-bold text-slate-900 dark:text-white">กรอกรหัส 6 หลัก</p>
                        <p className="text-sm text-slate-500 mt-1">เราส่งรหัสไปที่ <strong>{formData.email}</strong></p>
                    </div>
                    
                    <input name="otp" maxLength={6} onChange={handleChange} autoFocus className="w-full text-center text-5xl tracking-[0.25em] font-black py-4 bg-transparent border-b-4 border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none transition-all dark:text-white" placeholder="000000" />
                    
                    <div className="space-y-4">
                        <Button onClick={handleVerify} disabled={isLoading} className="w-full py-7 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg">
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'ยืนยันและอัปเกรดบัญชี'}
                        </Button>
                        <button onClick={() => setStep(1)} className="text-slate-400 text-sm font-bold flex items-center justify-center gap-1 mx-auto hover:text-slate-600 transition-colors">
                            <ArrowLeft className="w-4 h-4" /> เปลี่ยนอีเมล / แก้ไขข้อมูล
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}