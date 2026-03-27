'use client';
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FileText, Phone, Mail, MessageSquare, ShieldCheck, Loader2, RefreshCcw, PartyPopper, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import {
    validateThaiIdCard,
    validateThaiPhoneNumber,
    validateThaiFullName,
    validateAllSellerData,
    type ValidationResult
} from '@/lib/validators/idCardValidator';

// ✅ Component แสดงผลข้อความ Validation แบบ Realtime
function FieldValidation({ result, show }: { result: ValidationResult | null; show: boolean }) {
    if (!show || !result) return null;
    return (
        <p className={`text-xs mt-1 flex items-center gap-1 ${result.isValid ? 'text-emerald-600' : 'text-rose-600'}`}>
            {result.isValid ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            {result.message}
        </p>
    );
}

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
    const [receivedOtp, setReceivedOtp] = useState<string | null>(null);
    const [resendTimer, setResendTimer] = useState(0);

    // 🛡️ Validation State
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [validationResults, setValidationResults] = useState<Record<string, ValidationResult>>({});

    // 🛡️ Validate ทันทีเมื่อกรอกข้อมูล
    const runValidation = useCallback((name: string, value: string) => {
        let result: ValidationResult | null = null;
        switch (name) {
            case 'fullName':
                result = validateThaiFullName(value);
                break;
            case 'idCardNumber':
                result = validateThaiIdCard(value);
                break;
            case 'tel':
                result = validateThaiPhoneNumber(value);
                break;
        }
        if (result) {
            setValidationResults(prev => ({ ...prev, [name]: result! }));
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let processedValue = value;

        // จำกัดให้กรอกเฉพาะตัวเลข สำหรับเลขบัตรและเบอร์โทร
        if (name === 'idCardNumber') {
            processedValue = value.replace(/\D/g, '').slice(0, 13);
        }
        if (name === 'tel') {
            processedValue = value.replace(/\D/g, '').slice(0, 10);
        }

        setFormData(prev => ({ ...prev, [name]: processedValue }));
        
        // Validate realtime เมื่อ field ถูกแตะแล้ว
        if (touched[name]) {
            runValidation(name, processedValue);
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        runValidation(name, value);
    };

    // ตรวจสอบว่าฟอร์มถูกต้องทั้งหมดหรือไม่
    const isFormValid = () => {
        const { isValid } = validateAllSellerData({
            fullName: formData.fullName,
            idCardNumber: formData.idCardNumber,
            tel: formData.tel,
        });
        return isValid && formData.email.trim() !== '' && formData.lineId.trim() !== '';
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

        // 🛡️ Validate ข้อมูลทั้งหมดก่อนส่ง
        setTouched({ fullName: true, idCardNumber: true, tel: true });
        runValidation('fullName', formData.fullName);
        runValidation('idCardNumber', formData.idCardNumber);
        runValidation('tel', formData.tel);

        const { isValid, errors } = validateAllSellerData({
            fullName: formData.fullName,
            idCardNumber: formData.idCardNumber,
            tel: formData.tel,
        });

        if (!isValid) {
            const firstError = Object.values(errors)[0];
            setMessage({ text: firstError || 'กรุณาตรวจสอบข้อมูลอีกครั้ง', type: 'error' });
            return;
        }

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

        const result = await verifyOtp(formData.tel, otp, {
            fullName: formData.fullName,
            idCardNumber: formData.idCardNumber,
            email: formData.email,
            lineId: formData.lineId
        });

        if (result.success) {
            setStep(3);
            setMessage({ text: 'ยืนยันตัวตนสำเร็จ! คุณเป็นผู้ขายแล้ว 🎉', type: 'success' });
        } else {
            setMessage({ text: result.error || 'รหัส OTP ไม่ถูกต้องหรือหมดอายุ', type: 'error' });
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
        <div className="flex flex-col md:flex-row bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 shadow-2xl rounded-3xl overflow-hidden w-full max-w-5xl mx-auto ring-1 ring-slate-900/5 dark:ring-white/5">
            {/* 🌟 Left Image Side */}
            <div className="w-full md:w-5/12 relative hidden md:block bg-slate-950 flex-shrink-0">
                <img 
                    src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                    alt="Premium Real Estate" 
                    className="w-full h-full object-cover opacity-60 mix-blend-overlay"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
                
                <div className="absolute inset-x-0 bottom-0 p-10 flex flex-col justify-end h-full">
                    <div className="bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/20">
                        <ShieldCheck className="w-7 h-7 text-emerald-400" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-white mb-4 tracking-tight leading-tight">
                        ร่วมเป็นพาร์ทเนอร์<br/>ระดับ <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">พรีเมียม</span>
                    </h2>
                    <p className="text-slate-300 font-medium leading-relaxed text-sm">
                        เข้าถึงฐานลูกค้าคุณภาพและยกระดับการขายอสังหาริมทรัพย์ของคุณผ่านแพลตฟอร์ม HomeLink พร้อมเครื่องมือจัดการระดับมืออาชีพ
                    </p>
                </div>
            </div>

            {/* 🌟 Right Form Side */}
            <div className="w-full md:w-7/12 p-8 md:p-12 relative flex flex-col justify-center">
                {/* Header Steps */}
                <div className="flex justify-between items-center mb-10">
                    <div className="flex gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold shadow-md transition-all ${step >= 1 ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-500/30 border border-blue-400/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>1</div>
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold shadow-md transition-all ${step >= 2 ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-500/30 border border-blue-400/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'}`}>2</div>
                    </div>
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700">Step {step} of 2</span>
                </div>

                <div className="mb-8">
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
                        {step === 1 ? 'ข้อมูลผู้สมัครเป็นผู้ขาย' : 'ยืนยันตัวตนด้วย OTP'}
                    </h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {step === 1 ? 'กรุณากรอกข้อมูลส่วนตัวเพื่อรักษาความปลอดภัยระดับสูงสุดของแพลตฟอร์ม' : 'ป้อนรหัส 6 หลักที่ได้รับทาง SMS เพื่อยืนยันความถูกต้อง'}
                    </p>
                </div>

                {step === 1 ? (
                    <form onSubmit={handleRequestOtp} className="space-y-5">
                        {/* 🔔 คำแนะนำ */}
                        <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50 p-4 rounded-xl flex items-start gap-3 shadow-sm">
                            <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-blue-800 dark:text-blue-300 font-medium leading-relaxed">
                                ระบบจะตรวจสอบความถูกต้องของข้อมูลแบบ Realtime กรุณากรอกข้อมูลจริงเท่านั้นเพื่อสิทธิประโยชน์สูงสุด
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-5">
                            {/* ชื่อ-นามสกุล */}
                            <div className="space-y-2.5">
                                <label className="text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                    <FileText className="w-4 h-4 text-slate-400" /> ชื่อ-นามสกุลจริง (ภาษาไทย)
                                </label>
                                <div className="relative">
                                    <Input 
                                        name="fullName" 
                                        value={formData.fullName} 
                                        onChange={handleInputChange} 
                                        onBlur={handleBlur}
                                        required 
                                        placeholder="สมชาย ใจดี" 
                                        className={`h-12 pr-10 bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-blue-500/50 ${touched.fullName && validationResults.fullName ? (validationResults.fullName.isValid ? 'border-emerald-500 focus-visible:ring-emerald-500/50' : 'border-rose-500 focus-visible:ring-rose-500/50') : ''}`} 
                                    />
                                    {touched.fullName && validationResults.fullName && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 rounded-full">
                                            {validationResults.fullName.isValid 
                                                ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> 
                                                : <XCircle className="w-5 h-5 text-rose-500" />
                                            }
                                        </div>
                                    )}
                                </div>
                                <FieldValidation result={validationResults.fullName || null} show={!!touched.fullName} />
                            </div>

                            {/* เลขบัตรประชาชน */}
                            <div className="space-y-2.5">
                                <label className="text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                    <ShieldCheck className="w-4 h-4 text-slate-400" /> เลขบัตรประชาชน (13 หลัก)
                                </label>
                                <div className="relative">
                                    <Input 
                                        name="idCardNumber" 
                                        value={formData.idCardNumber} 
                                        onChange={handleInputChange} 
                                        onBlur={handleBlur}
                                        required 
                                        maxLength={13} 
                                        placeholder="x-xxxx-xxxxx-xx-x" 
                                        className={`h-12 pr-10 bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-700 rounded-xl tracking-widest font-mono focus-visible:ring-blue-500/50 ${touched.idCardNumber && validationResults.idCardNumber ? (validationResults.idCardNumber.isValid ? 'border-emerald-500 focus-visible:ring-emerald-500/50' : 'border-rose-500 focus-visible:ring-rose-500/50') : ''}`}
                                    />
                                    {touched.idCardNumber && validationResults.idCardNumber && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 rounded-full">
                                            {validationResults.idCardNumber.isValid 
                                                ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> 
                                                : <XCircle className="w-5 h-5 text-rose-500" />
                                            }
                                        </div>
                                    )}
                                </div>
                                <FieldValidation result={validationResults.idCardNumber || null} show={!!touched.idCardNumber} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* เบอร์โทรศัพท์ */}
                                <div className="space-y-2.5">
                                    <label className="text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                        <Phone className="w-4 h-4 text-slate-400" /> เบอร์โทรศัพท์
                                    </label>
                                    <div className="relative">
                                        <Input 
                                            name="tel" 
                                            value={formData.tel} 
                                            onChange={handleInputChange} 
                                            onBlur={handleBlur}
                                            required 
                                            maxLength={10}
                                            placeholder="08xxxxxxxx" 
                                            className={`h-12 pr-10 bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-blue-500/50 ${touched.tel && validationResults.tel ? (validationResults.tel.isValid ? 'border-emerald-500 focus-visible:ring-emerald-500/50' : 'border-rose-500 focus-visible:ring-rose-500/50') : ''}`}
                                        />
                                        {touched.tel && validationResults.tel && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 rounded-full">
                                                {validationResults.tel.isValid 
                                                    ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> 
                                                    : <XCircle className="w-5 h-5 text-rose-500" />
                                                }
                                            </div>
                                        )}
                                    </div>
                                    <FieldValidation result={validationResults.tel || null} show={!!touched.tel} />
                                </div>

                                {/* Line ID */}
                                <div className="space-y-2.5">
                                    <label className="text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                        <MessageSquare className="w-4 h-4 text-slate-400" /> Line ID
                                    </label>
                                    <Input name="lineId" value={formData.lineId} onChange={handleInputChange} required placeholder="line_id" className="h-12 bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-blue-500/50" />
                                </div>
                            </div>

                            {/* อีเมล */}
                            <div className="space-y-2.5">
                                <label className="text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                    <Mail className="w-4 h-4 text-slate-400" /> อีเมล
                                </label>
                                <Input name="email" type="email" value={formData.email} onChange={handleInputChange} required placeholder="example@email.com" className="h-12 bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-blue-500/50" />
                            </div>
                        </div>

                        {message && (
                            <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 mt-2 ${message.type === 'success' ? 'bg-emerald-50/80 text-emerald-700 border border-emerald-200' : 'bg-rose-50/80 text-rose-700 border border-rose-200'}`}>
                                {message.type === 'error' ? <XCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
                                {message.text}
                            </div>
                        )}

                        <Button 
                            type="submit" 
                            disabled={isLoading || !isFormValid()} 
                            className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-lg font-bold rounded-xl mt-6 shadow-xl shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin mr-3" /> : null}
                            ดำเนินการต่อเพื่อรับ OTP
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-8">
                        <div className="text-center space-y-3 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">รหัส OTP ถูกส่งไปที่เบอร์</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-widest">{formData.tel}</p>
                            {receivedOtp && (
                                <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 px-4 py-2 rounded-xl inline-block shadow-sm">
                                    <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">รหัสทดสอบ (Mock): <span className="text-sm font-bold ml-1">{receivedOtp}</span></p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <label className="text-sm font-bold block text-center text-slate-700 dark:text-slate-300">กรอกรหัส OTP 6 หลัก</label>
                            <Input 
                                value={otp} 
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                                required 
                                maxLength={6} 
                                placeholder="000000" 
                                className="h-16 text-center text-3xl tracking-[1em] font-black border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500/50 bg-white/50 dark:bg-slate-950/50 rounded-2xl shadow-inner transition-all focus:ring-4 focus:ring-blue-500/20" 
                            />
                        </div>

                        {message && (
                            <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50/80 text-emerald-700 border border-emerald-200' : 'bg-rose-50/80 text-rose-700 border border-rose-200'}`}>
                                {message.type === 'error' ? <XCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
                                {message.text}
                            </div>
                        )}

                        <div className="flex flex-col gap-4 mt-8">
                            <Button type="submit" disabled={isLoading || otp.length < 6} className="w-full h-14 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-lg font-bold rounded-xl shadow-xl shadow-emerald-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
                                {isLoading ? <Loader2 className="w-6 h-6 animate-spin mr-3" /> : null}
                                ยืนยันรหัส OTP และส่วใบสมัคร
                            </Button>

                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => handleRequestOtp()} 
                                disabled={isLoading || resendTimer > 0}
                                className="w-full h-14 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                            >
                                <RefreshCcw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                                {resendTimer > 0 ? `ส่งรหัสอีกครั้งใน (${resendTimer}s)` : 'ส่งรหัส OTP อีกครั้ง'}
                            </Button>
                            
                            <Button type="button" variant="ghost" onClick={() => setStep(1)} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium">
                                ย้อนกลับเพื่อแก้ไขข้อมูล
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}