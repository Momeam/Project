'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FileText, Phone, Mail, MessageSquare, ShieldCheck, Loader2, RefreshCcw, PartyPopper } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';

export default function VerificationForm() {
    const { currentUser, requestOtp, verifyOtp } = useAuthStore();
    
    const [formData, setFormData] = useState({
        fullName: '',
        idCardNumber: '',
        tel: currentUser?.tel || '',
        lineId: '',
        email: currentUser?.email || ''
    });
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1); // 1: Info, 2: OTP, 3: Success
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [receivedOtp, setReceivedOtp] = useState<string | null>(null); // สำหรับ Mock
    const [resendTimer, setResendTimer] = useState(0);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const startTimer = () => {
        setResendTimer(60);
        const timer = setInterval(() => {
            setResendTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleRequestOtp = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setIsLoading(true);
        setMessage(null);
        
        const code = await requestOtp(formData.tel);
        if (code) {
            setStep(2);
            setReceivedOtp(code);
            setMessage({ text: 'ส่งรหัส OTP เรียบร้อยแล้ว! (จำลอง)', type: 'success' });
            startTimer();
        } else {
            setMessage({ text: 'เกิดข้อผิดพลาดในการส่ง OTP', type: 'error' });
        }
        setIsLoading(false);
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        const success = await verifyOtp(formData.tel, otp, {
            fullName: formData.fullName,
            idCardNumber: formData.idCardNumber,
            email: formData.email,
            lineId: formData.lineId
        });

        if (success) {
            setStep(3);
            setMessage({ text: 'ยืนยันตัวตนสำเร็จ! คุณเป็นผู้ขายแล้ว 🎉', type: 'success' });
        } else {
            setMessage({ text: 'รหัส OTP ไม่ถูกต้องหรือหมดอายุ', type: 'error' });
        }
        setIsLoading(false);
    };

    if (step === 3) {
        return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-hidden">
                {/* 🎊 เอฟเฟกต์พลุกระดาษจำลองด้วย CSS */}
                <div className="absolute inset-0 pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                        <div 
                            key={i} 
                            className="absolute w-3 h-3 rounded-sm animate-ping"
                            style={{
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5],
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${1 + Math.random() * 2}s`
                            }}
                        />
                    ))}
                </div>

                <Card className="max-w-md w-full shadow-[0_0_50px_rgba(59,130,246,0.3)] border-none text-center overflow-hidden animate-in fade-in zoom-in slide-in-from-bottom-10 duration-500 relative z-10 bg-white/95">
                    <div className="h-3 bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-500 w-full animate-pulse" />
                    <CardContent className="p-10">
                        <div className="relative mb-8">
                            <div className="bg-emerald-100 w-28 h-28 rounded-full flex items-center justify-center mx-auto relative z-10 shadow-inner">
                                <PartyPopper className="w-14 h-14 text-emerald-600 animate-bounce" />
                            </div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-emerald-200/40 rounded-full animate-ping" />
                            <div className="absolute -top-4 -right-4 bg-yellow-400 text-white p-2 rounded-full rotate-12 animate-pulse shadow-lg">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                        </div>

                        <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">เซอร์ไพรส์! 🎉</h2>
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-5 rounded-2xl mb-8 shadow-lg transform -rotate-1">
                            <p className="text-white font-black text-2xl drop-shadow-md">
                                ยินดีด้วยคุณได้เป็นคนขายแล้ว!
                            </p>
                            <p className="text-emerald-50 text-sm mt-2 font-medium">
                                การยืนยันตัวตนผ่าน OTP สำเร็จ 100%
                            </p>
                        </div>
                        
                        <p className="text-slate-500 mb-10 text-base leading-relaxed font-medium">
                            เราได้เปิดระบบการลงประกาศขายให้คุณแล้ว <br/>
                            เริ่มสร้างรายได้จากอสังหาริมทรัพย์ของคุณได้ทันที!
                        </p>

                        <Button asChild className="w-full h-16 bg-slate-900 hover:bg-black text-white text-xl font-black rounded-2xl shadow-2xl transition-all hover:scale-[1.05] active:scale-[0.95] flex items-center justify-center gap-3">
                            <a href="/user/dashboard">
                                เข้าสู่ระบบผู้ขาย <RefreshCcw className="w-5 h-5" />
                            </a>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <Card className="max-w-xl mx-auto shadow-lg dark:bg-gray-800 border-t-4 border-t-blue-500">
            <CardHeader>
                <div className="flex justify-between items-center mb-2">
                    <div className="flex gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Step {step} of 2</span>
                </div>
                <CardTitle className="text-2xl flex items-center">
                    <ShieldCheck className="w-6 h-6 mr-2 text-blue-500" />
                    {step === 1 ? 'ข้อมูลผู้สมัครเป็นผู้ขาย' : 'ยืนยันตัวตนด้วย OTP'}
                </CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {step === 1 ? 'กรุณากรอกข้อมูลส่วนตัวเพื่อใช้ในการยืนยันสิทธิ์ผู้ขาย' : 'ป้อนรหัส 6 หลักที่ได้รับทาง SMS'}
                </p>
            </CardHeader>
            <CardContent>
                {step === 1 ? (
                    <form onSubmit={handleRequestOtp} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-slate-400" /> ชื่อ-นามสกุลจริง
                                </label>
                                <Input name="fullName" value={formData.fullName} onChange={handleInputChange} required placeholder="นาย สมชาย ใจดี" className="h-11" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-slate-400" /> เลขบัตรประชาชน (13 หลัก)
                                </label>
                                <Input name="idCardNumber" value={formData.idCardNumber} onChange={handleInputChange} required maxLength={13} placeholder="1234567890123" className="h-11" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-slate-400" /> เบอร์โทรศัพท์
                                    </label>
                                    <Input name="tel" value={formData.tel} onChange={handleInputChange} required placeholder="08xxxxxxxx" className="h-11" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4 text-slate-400" /> Line ID
                                    </label>
                                    <Input name="lineId" value={formData.lineId} onChange={handleInputChange} required placeholder="line_id" className="h-11" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-slate-400" /> อีเมล
                                </label>
                                <Input name="email" type="email" value={formData.email} onChange={handleInputChange} required placeholder="example@email.com" className="h-11" />
                            </div>
                        </div>

                        {message && (
                            <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                {message.text}
                            </div>
                        )}

                        <Button type="submit" disabled={isLoading} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl mt-4 shadow-lg shadow-blue-500/20">
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                            ดำเนินการต่อเพื่อรับ OTP
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-6">
                        <div className="text-center space-y-2">
                            <p className="text-sm text-slate-600">รหัส OTP ถูกส่งไปที่เบอร์ <span className="font-bold text-slate-900">{formData.tel}</span></p>
                            {receivedOtp && (
                                <div className="bg-amber-50 border border-amber-100 p-2 rounded-lg inline-block">
                                    <p className="text-xs text-amber-700 font-medium">รหัสทดสอบ (Mock): <span className="text-sm font-bold">{receivedOtp}</span></p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium block text-center">กรอกรหัส OTP 6 หลัก</label>
                            <Input value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} placeholder="000000" className="h-14 text-center text-2xl tracking-[1em] font-bold border-2 focus:border-blue-500 rounded-xl" />
                        </div>

                        {message && (
                            <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                {message.text}
                            </div>
                        )}

                        <div className="flex flex-col gap-3">
                            <Button type="submit" disabled={isLoading || otp.length < 6} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20">
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                                ยืนยันรหัส OTP และส่งใบสมัคร
                            </Button>

                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => handleRequestOtp()} 
                                disabled={isLoading || resendTimer > 0}
                                className="w-full h-12 border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                            >
                                <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                {resendTimer > 0 ? `ส่งรหัสอีกครั้งใน (${resendTimer}s)` : 'ส่งรหัส OTP อีกครั้ง'}
                            </Button>
                            
                            <Button type="button" variant="ghost" onClick={() => setStep(1)} className="text-slate-500">
                                ย้อนกลับเพื่อแก้ไขข้อมูล
                            </Button>
                        </div>
                    </form>
                )}
            </CardContent>
        </Card>
    );
}