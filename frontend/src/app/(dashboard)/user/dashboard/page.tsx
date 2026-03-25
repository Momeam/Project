'use client';

import React, { useState, useMemo, useEffect } from 'react';
import VerificationForm from '@/components/VerificationForm'; 
import AddListingForm from '@/components/AddListingForm';
import AnnouncementBanner from '@/components/AnnouncementBanner'; // 👈 นำเข้า Banner ประกาศ
import { useAuthStore } from '@/stores/useAuthStore';
import { usePropertyStore } from '@/stores/usePropertyStore'; 
import Link from 'next/link';
import { Clock, XCircle, Plus, List, Trash2, Eye, ArrowLeft, PartyPopper, RefreshCcw } from 'lucide-react'; 
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function UserDashboardPage() {
    const [isMounted, setIsMounted] = useState(false);
    
    const currentUser = useAuthStore((state) => state.currentUser);
    const userId = currentUser?.id;
    const role = currentUser?.role;
    const justUpgraded = useAuthStore((state) => state.justUpgraded); // 👈 ดึงค่ามาเช็ก
    const setJustUpgraded = useAuthStore((state) => state.setJustUpgraded); // 👈 ดึง action มาเคลียร์ค่า
    const verificationStatus = currentUser?.verificationStatus || 'IDLE';

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const allListings = usePropertyStore((state) => state.properties);
    const deleteProperty = usePropertyStore((state) => state.deleteProperty);

    const myListings = useMemo(() => {
        if (!userId) return [];
        return allListings.filter(p => String(p.userId) === String(userId));
    }, [allListings, userId]);

    const [activeTab, setActiveTab] = useState<'LIST' | 'ADD'>('LIST');

    const handleDelete = (id: string) => {
        if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบประกาศนี้?")) {
            deleteProperty(id, userId ? String(userId) : '', 'SELLER');
        }
    };

    if (!isMounted) return null;

    // -------------------------------------------------------
    // 0. ส่วนแสดงผล ป๊อปอัปเซอร์ไพรส์ (เมื่อเพิ่งอัปเกรดเสร็จ)
    // -------------------------------------------------------
    if (justUpgraded) {
        return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                        <div key={i} className="absolute w-3 h-3 rounded-sm animate-ping"
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
                        </div>

                        <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">เซอร์ไพรส์! 🎉</h2>
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-5 rounded-2xl mb-8 shadow-lg transform -rotate-1">
                            <p className="text-white font-black text-2xl drop-shadow-md">
                                ยินดีด้วยคุณได้เป็นคนขายแล้ว!
                            </p>
                        </div>
                        
                        <p className="text-slate-500 mb-10 text-base leading-relaxed font-medium">
                            เราได้เปิดระบบการลงประกาศขายให้คุณแล้ว <br/>
                            เริ่มสร้างรายได้จากอสังหาริมทรัพย์ของคุณได้ทันที!
                        </p>

                        <Button 
                            onClick={() => setJustUpgraded(false)} // 👈 กดแล้วเคลียร์ค่าเพื่อเข้าหน้า Dashboard จริง
                            className="w-full h-16 bg-slate-900 hover:bg-black text-white text-xl font-black rounded-2xl shadow-2xl transition-all hover:scale-[1.05] active:scale-[0.95] flex items-center justify-center gap-3"
                        >
                            เข้าสู่ระบบผู้ขาย <RefreshCcw className="w-5 h-5" />
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // -------------------------------------------------------
    // 1. ส่วนแสดงผลสำหรับ SELLER (อนุมัติแล้ว)
    // -------------------------------------------------------
    if (role === 'SELLER') {
        return (
            <div className="container mx-auto p-4 md:py-8 max-w-5xl">
                
                {/* 📢 แสดงประกาศและสิทธิพิเศษจากแอดมิน */}
                <AnnouncementBanner />

                {/* Header Dashboard */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div className="flex items-center gap-4 w-full">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Seller Dashboard
                        </h1>
                    </div>
                    <div className="flex space-x-2">
                        <Button 
                            variant={activeTab === 'LIST' ? 'default' : 'outline'}
                            onClick={() => setActiveTab('LIST')}
                        >
                            <List className="w-4 h-4 mr-2" /> รายการของฉัน ({myListings.length})
                        </Button>
                        <Button 
                            variant={activeTab === 'ADD' ? 'default' : 'outline'}
                            onClick={() => setActiveTab('ADD')}
                            className={activeTab === 'ADD' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                        >
                            <Plus className="w-4 h-4 mr-2" /> ลงประกาศใหม่
                        </Button>
                    </div>
                </div>

                {/* Content Area */}
                {activeTab === 'LIST' ? (
                    <div className="space-y-4">
                        {myListings.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed">
                                <p className="text-gray-500">คุณยังไม่มีประกาศอสังหาริมทรัพย์</p>
                                <Button variant="link" onClick={() => setActiveTab('ADD')} className="text-blue-600">
                                    เริ่มลงประกาศเลย!
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {myListings.map((item) => (
                                    <Card key={item.id} className="dark:bg-gray-800 overflow-hidden flex flex-row h-32">
                                        <div className="w-32 bg-gray-200 relative">
                                            <img 
                                                src={item.images[0]?.url || 'https://placehold.co/150?text=No+Img'} 
                                                alt={item.title}
                                                className="w-full h-full object-cover"
                                            />
                                            <span className={`absolute top-0 left-0 px-2 py-0.5 text-xs text-white ${item.status === 'ACTIVE' ? 'bg-green-500' : 'bg-yellow-500'}`}>
                                                {item.status}
                                            </span>
                                        </div>
                                        <CardContent className="flex-1 p-3 flex flex-col justify-between">
                                            <div>
                                                <h3 className="font-bold text-sm line-clamp-1">{item.title}</h3>
                                                <p className="text-xs text-gray-500">{item.category} • {item.type}</p>
                                                <p className="text-red-600 font-bold text-sm">฿{item.price.toLocaleString()}</p>
                                            </div>
                                            <div className="flex justify-end space-x-2">
                                                <Link href={`/listings/${item.id}`} target="_blank">
                                                    <Button size="sm" variant="ghost" className="h-7 px-2"><Eye className="w-3 h-3" /></Button>
                                                </Link>
                                                <Button 
                                                    size="sm" 
                                                    variant="destructive" 
                                                    className="h-7 px-2"
                                                    onClick={() => handleDelete(item.id)}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    // หน้าลงประกาศ
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Button 
                            variant="ghost" 
                            onClick={() => setActiveTab('LIST')} 
                            className="mb-4 text-gray-500"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" /> ยกเลิก / กลับไปหน้ารายการ
                        </Button>
                        
                        <AddListingForm />
                    </div>
                )}
            </div>
        );
    }

    // -------------------------------------------------------
    // 2. ส่วนแสดงผลสำหรับ USER (ยังไม่อนุมัติ / รอตรวจสอบ)
    // -------------------------------------------------------
    return (
        <div className="container mx-auto p-4 md:py-8 max-w-4xl">
            
            {/* 📢 แสดงประกาศและสิทธิพิเศษจากแอดมิน */}
            <AnnouncementBanner />
            
            <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
                สมัครเป็นผู้ขาย
            </h1>

            {verificationStatus === 'PENDING' && (
                <div className="text-center p-10 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg max-w-lg mx-auto space-y-3">
                    <Clock className="w-10 h-10 mx-auto text-yellow-600" />
                    <h2 className="text-xl font-bold text-yellow-800 dark:text-yellow-300">
                        คำขอของคุณอยู่ในระหว่างการตรวจสอบ
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        แอดมินกำลังดำเนินการตรวจสอบเอกสาร กรุณารอการแจ้งเตือน
                    </p>
                </div>
            )}

            {verificationStatus === 'REJECTED' && (
                <div className="space-y-6">
                     <div className="text-center p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg max-w-lg mx-auto space-y-2">
                        <XCircle className="w-8 h-8 mx-auto text-red-600" />
                        <h2 className="text-lg font-bold text-red-800 dark:text-red-300">
                            คำขอยืนยันตัวตนถูกปฏิเสธ
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            กรุณาส่งเอกสารใหม่ให้ถูกต้อง
                        </p>
                    </div>
                    <VerificationForm />
                </div>
            )}

            {verificationStatus === 'IDLE' && (
                <div className="space-y-6">
                    <p className="text-gray-600 dark:text-gray-300">
                        เพื่อเริ่มต้นใช้งานระบบผู้ขายและลงประกาศอสังหาริมทรัพย์ กรุณายืนยันตัวตน:
                    </p>
                    <VerificationForm />
                </div>
            )}
        </div>
    );
}