'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import { Mail, Send, Loader2, Key, User, Smartphone, CreditCard, ArrowLeft, Home, Building2, Briefcase, Check, LayoutGrid, Upload, PenTool } from 'lucide-react';

// ข้อมูล Seller Type ทั้ง 3 แบบ พร้อมรายละเอียดความสามารถ
const SELLER_TYPES = [
    {
        value: 'OWNER',
        label: 'เจ้าของห้อง / บ้าน',
        labelEn: 'Room Owner',
        icon: Home,
        color: 'emerald',
        gradient: 'from-emerald-500 to-teal-600',
        bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
        borderSelected: 'border-emerald-500 ring-emerald-200 dark:ring-emerald-800',
        iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        checkBg: 'bg-emerald-500',
        features: [
            { icon: PenTool, text: 'ออกแบบแปลนห้อง/บ้านด้วยตัวเอง' },
            { icon: LayoutGrid, text: 'จัดวางผังภายในห้องคอนโด' },
            { icon: Home, text: 'ลงขาย/เช่าทรัพย์สินของตัวเอง' },
        ],
        description: 'เหมาะสำหรับเจ้าของบ้านหรือเจ้าของห้องคอนโดที่ต้องการลงประกาศเอง',
    },
    {
        value: 'AGENT',
        label: 'นายหน้า',
        labelEn: 'Agent',
        icon: Briefcase,
        color: 'blue',
        gradient: 'from-blue-500 to-indigo-600',
        bgLight: 'bg-blue-50 dark:bg-blue-900/20',
        borderSelected: 'border-blue-500 ring-blue-200 dark:ring-blue-800',
        iconBg: 'bg-blue-100 dark:bg-blue-900/50',
        iconColor: 'text-blue-600 dark:text-blue-400',
        checkBg: 'bg-blue-500',
        features: [
            { icon: Upload, text: 'อัปโหลดรูปแปลนต้นฉบับจากเจ้าของ' },
            { icon: Briefcase, text: 'ลงประกาศแทนเจ้าของทรัพย์' },
            { icon: Home, text: 'บริหารหลายทรัพย์พร้อมกันได้' },
        ],
        description: 'เหมาะสำหรับนายหน้าที่รับฝากขาย/เช่าให้เจ้าของทรัพย์สิน',
    },
    {
        value: 'DEVELOPER',
        label: 'เจ้าของโครงการ',
        labelEn: 'Project Developer',
        icon: Building2,
        color: 'violet',
        gradient: 'from-violet-500 to-purple-600',
        bgLight: 'bg-violet-50 dark:bg-violet-900/20',
        borderSelected: 'border-violet-500 ring-violet-200 dark:ring-violet-800',
        iconBg: 'bg-violet-100 dark:bg-violet-900/50',
        iconColor: 'text-violet-600 dark:text-violet-400',
        checkBg: 'bg-violet-500',
        features: [
            { icon: Building2, text: 'สร้างโครงการคอนโดทั้งตึก' },
            { icon: LayoutGrid, text: 'ออกแบบผังชั้น + จัดวางห้องทุกชั้น' },
            { icon: PenTool, text: 'กำหนดราคา/สถานะห้องแต่ละห้อง' },
        ],
        description: 'เหมาะสำหรับ Developer ที่ต้องการบริหารโครงการคอนโดทั้งตึก',
    },
];

export default function VerificationForm() {
    const currentUser = useAuthStore((state) => state.currentUser);

    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    
    // ตั้งค่าเริ่มต้นของฟอร์ม (ดึง email จาก user ถ้ามี)
    const [formData, setFormData] = useState({
        firstName: '', 
        lastName: '', 
        idCard: '', 
        tel: '', 
        otp: '', 
        email: currentUser?.email || '',
        sellerType: 'OWNER' // ค่าเริ่มต้น
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
            const res = await fetch(`/api/otp/send-email`, {
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `/api`}/users/upgrade/${currentUser?.id}`, {
                method: 'PUT',

                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    otp: formData.otp,
                    email: formData.email,
                    tel: formData.tel,
                    realName: `${formData.firstName} ${formData.lastName}`,
                    sellerType: formData.sellerType
                })
            });

            if (res.ok) {
                // อัปเดตสถานะในแอปทันที! เป็น SELLER แล้ว
                useAuthStore.setState((state: any) => ({
                    currentUser: state.currentUser ? { ...state.currentUser, role: 'SELLER', seller_type: formData.sellerType, tel: formData.tel } : null,
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

    const selectedType = SELLER_TYPES.find(t => t.value === formData.sellerType)!;

    return (
        <div className="max-w-2xl mx-auto p-8 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800">
            {step === 1 ? (
                <form onSubmit={handleRequestOtp} className="space-y-6">
                    <div className="text-center mb-6">
                        <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <User className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white">ยืนยันตัวตนผู้ขาย</h2>
                        <p className="text-sm text-slate-400 mt-1">เลือกประเภทผู้ขายและกรอกข้อมูลเพื่อเริ่มลงประกาศ</p>
                    </div>

                    {/* ===== Seller Type Cards ===== */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1 tracking-wider">เลือกประเภทผู้ขาย</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {SELLER_TYPES.map((type) => {
                                const isSelected = formData.sellerType === type.value;
                                const Icon = type.icon;
                                return (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, sellerType: type.value }))}
                                        className={`relative group text-left p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer
                                            ${isSelected 
                                                ? `${type.borderSelected} ring-4 shadow-lg scale-[1.02]` 
                                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md'
                                            }`}
                                    >
                                        {/* Checkmark badge */}
                                        {isSelected && (
                                            <div className={`absolute -top-2 -right-2 w-6 h-6 ${type.checkBg} rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-200`}>
                                                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                            </div>
                                        )}

                                        {/* Icon */}
                                        <div className={`w-10 h-10 ${type.iconBg} rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 ${isSelected ? 'scale-110' : 'group-hover:scale-105'}`}>
                                            <Icon className={`w-5 h-5 ${type.iconColor}`} />
                                        </div>

                                        {/* Title */}
                                        <h3 className={`font-bold text-sm leading-tight ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {type.label}
                                        </h3>
                                        <p className={`text-[10px] font-semibold mt-0.5 ${isSelected ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                            {type.labelEn}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Selected type details panel */}
                        <div className={`mt-3 p-4 rounded-2xl ${selectedType.bgLight} border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-300`} key={selectedType.value}>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">{selectedType.description}</p>
                            <div className="space-y-2">
                                {selectedType.features.map((feat, i) => {
                                    const FeatIcon = feat.icon;
                                    return (
                                        <div key={i} className="flex items-center gap-2.5">
                                            <div className={`w-5 h-5 rounded-md ${selectedType.iconBg} flex items-center justify-center flex-shrink-0`}>
                                                <FeatIcon className={`w-3 h-3 ${selectedType.iconColor}`} />
                                            </div>
                                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{feat.text}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* ===== Divider ===== */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700" /></div>
                        <div className="relative flex justify-center"><span className="bg-white dark:bg-slate-900 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">ข้อมูลส่วนตัว</span></div>
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

                    <Button type="submit" disabled={isLoading} className={`w-full py-7 text-white rounded-xl font-bold text-lg shadow-lg transition-all active:scale-95 bg-gradient-to-r ${selectedType.gradient} hover:opacity-90`}>
                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>รับรหัส OTP ทางอีเมล <Send className="w-4 h-4 ml-2" /></>}
                    </Button>
                </form>
            ) : (
                <div className="space-y-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* แสดงประเภทที่เลือกไว้ */}
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${selectedType.bgLight} border border-slate-200 dark:border-slate-700`}>
                        <selectedType.icon className={`w-4 h-4 ${selectedType.iconColor}`} />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">สมัครเป็น: {selectedType.label}</span>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-3xl">
                        <Key className="w-10 h-10 mx-auto text-blue-600 mb-2" />
                        <p className="font-bold text-slate-900 dark:text-white">กรอกรหัส 6 หลัก</p>
                        <p className="text-sm text-slate-500 mt-1">เราส่งรหัสไปที่ <strong>{formData.email}</strong></p>
                    </div>
                    
                    <input name="otp" maxLength={6} onChange={handleChange} autoFocus className="w-full text-center text-5xl tracking-[0.25em] font-black py-4 bg-transparent border-b-4 border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none transition-all dark:text-white" placeholder="000000" />
                    
                    <div className="space-y-4">
                        <Button onClick={handleVerify} disabled={isLoading} className={`w-full py-7 text-white rounded-xl font-bold text-lg shadow-lg bg-gradient-to-r ${selectedType.gradient} hover:opacity-90`}>
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : `ยืนยันและอัปเกรดเป็น${selectedType.label}`}
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