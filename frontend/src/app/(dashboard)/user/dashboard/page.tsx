'use client';

import React, { useState, useMemo, useEffect } from 'react';
import VerificationForm from '@/components/VerificationForm'; 
import AddListingForm from '@/components/AddListingForm';
import AnnouncementBanner from '@/components/AnnouncementBanner';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePropertyStore } from '@/stores/usePropertyStore'; 
import { useInquiryStore } from '@/stores/useInquiryStore'; 
import Link from 'next/link';
import { Clock, XCircle, Plus, List, Trash2, Eye, ArrowLeft, PartyPopper, RefreshCcw, MessageSquare, User, Mail, Phone, Edit } from 'lucide-react'; 
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UserDashboardPage() {
    const [isMounted, setIsMounted] = useState(false);
    const [editingProperty, setEditingProperty] = useState<any>(null);
    
    // ดึงข้อมูล User จาก Store
    const currentUser = useAuthStore((state) => state.currentUser);
    const userId = currentUser?.id;
    const role = currentUser?.role;

    
    const justUpgraded = useAuthStore((state) => state.justUpgraded); 
    

    const { inquiries, fetchInquiries, isLoading: isLoadingInquiries } = useInquiryStore();

    // ดึงข้อมูล Property จาก API จริง
    const allListings = usePropertyStore((state) => state.properties);
    const fetchProperties = usePropertyStore((state) => state.fetchProperties);

    useEffect(() => {
        setIsMounted(true);
        fetchProperties();
        
        if (role === 'SELLER' || role === 'ADMIN') {
            fetchInquiries();
        }
    }, [role, fetchProperties, fetchInquiries]);

    // กรองเอาเฉพาะประกาศที่ userId ตรงกับคนที่ล็อกอินอยู่
    const myListings = useMemo(() => {
        if (!userId) return [];
        return allListings.filter(p => String(p.userId || p.userid) === String(userId));
    }, [allListings, userId]);

    const [activeTab, setActiveTab] = useState<'LIST' | 'ADD' | 'INQUIRIES'>('LIST');

    // ระบบลบประกาศ 
    const handleDelete = async (id: string) => {
        if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบประกาศนี้? 🗑️")) {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `/api`}/properties/${id}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    alert('ลบประกาศออกจากฐานข้อมูลสำเร็จ! ✅');
                    fetchProperties(); 
                } else {
                    const data = await response.json();
                    alert(`ไม่สามารถลบได้: ${data.error}`);
                }
            } catch (error) {
                console.error('Delete error:', error);
                alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
            }
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
    onClick={() => useAuthStore.setState({ justUpgraded: false })} 
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
    // 1. ส่วนแสดงผลสำหรับ SELLER หรือ ADMIN
    // -------------------------------------------------------
    if (role === 'SELLER' || role === 'ADMIN') {
        return (
            <div className="container mx-auto p-4 md:py-8 max-w-5xl">
                
                <AnnouncementBanner />

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div className="flex items-center gap-4 w-full">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Seller Dashboard
                        </h1>
                    </div>
                    <div className="flex space-x-2 overflow-x-auto pb-2 sm:pb-0">
                        <Button 
                            variant={activeTab === 'LIST' ? 'default' : 'outline'}
                            onClick={() => { setActiveTab('LIST'); setEditingProperty(null); fetchProperties(); }}
                            className="whitespace-nowrap"
                        >
                            <List className="w-4 h-4 mr-2" /> รายการของฉัน ({myListings.length})
                        </Button>
                        <Button 
                            variant={activeTab === 'INQUIRIES' ? 'default' : 'outline'}
                            onClick={() => setActiveTab('INQUIRIES')}
                            className="whitespace-nowrap"
                        >
                            <MessageSquare className="w-4 h-4 mr-2" /> ข้อความ ({inquiries.length})
                        </Button>
                        <Button 
                            variant={activeTab === 'ADD' ? 'default' : 'outline'}
                            onClick={() => { setEditingProperty(null); setActiveTab('ADD'); }}
                            className={`whitespace-nowrap ${activeTab === 'ADD' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                        >
                            <Plus className="w-4 h-4 mr-2" /> ลงประกาศใหม่
                        </Button>
                    </div>
                </div>

                {activeTab === 'LIST' ? (
                    <div className="space-y-4">
                        {myListings.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed">
                                <p className="text-gray-500">คุณยังไม่มีประกาศอสังหาริมทรัพย์ในระบบ</p>
                                <Button variant="link" onClick={() => setActiveTab('ADD')} className="text-blue-600">
                                    เริ่มลงประกาศแรกของคุณเลย!
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {myListings.map((item) => {
                                    const imageUrl = item.images && item.images.length > 0 
                                        ? (item.images[0].url || item.images[0]) 
                                        : 'https://placehold.co/150?text=No+Img';

                                    return (
                                        <Card key={item.id} className="dark:bg-gray-800 overflow-hidden flex flex-row h-32">
                                            <div className="w-32 bg-gray-200 relative">
                                                <img 
                                                    src={imageUrl} 
                                                    alt={item.title}
                                                    className="w-full h-full object-cover"
                                                />
                                                <span className={`absolute top-0 left-0 px-2 py-0.5 text-xs text-white ${item.status === 'ACTIVE' ? 'bg-green-500' : 'bg-yellow-500'}`}>
                                                    {item.status || 'ACTIVE'}
                                                </span>
                                            </div>
                                            <CardContent className="flex-1 p-3 flex flex-col justify-between">
                                                <div>
                                                    <h3 className="font-bold text-sm line-clamp-1">{item.title}</h3>
                                                    <p className="text-xs text-gray-500">{item.category} • {item.type}</p>
                                                    <p className="text-red-600 font-bold text-sm">฿{Number(item.price).toLocaleString()}</p>
                                                </div>
                                                <div className="flex justify-end space-x-2">
                                                    <Link href={`/listings/${item.id}`} target="_blank">
                                                        <Button size="sm" variant="ghost" className="h-7 px-2"><Eye className="w-3 h-3" /></Button>
                                                    </Link>
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline" 
                                                        className="h-7 px-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                                                        onClick={() => {
                                                            setEditingProperty(item);
                                                            setActiveTab('ADD');
                                                        }}
                                                    >
                                                        <Edit className="w-3 h-3" />
                                                    </Button>
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
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : activeTab === 'INQUIRIES' ? (
                    <div className="space-y-6">
                        {isLoadingInquiries ? (
                            <div className="text-center py-12">กำลังโหลดข้อความ...</div>
                        ) : inquiries.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed">
                                <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                                <p className="text-gray-500">ยังไม่มีใครส่งข้อความสอบถามเข้ามา</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {inquiries.map((inquiry) => (
                                    <Card key={inquiry.id} className="dark:bg-gray-800 border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                                    <User className="w-5 h-5 text-blue-500" />
                                                    {inquiry.sender_name}
                                                </CardTitle>
                                            </div>
                                            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                                สนใจ: {inquiry.property_title || 'ไม่ระบุชื่อทรัพย์'}
                                            </p>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl italic text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-700/50">
                                                "{inquiry.message}"
                                            </div>
                                            <div className="flex flex-wrap gap-4 pt-2 border-t border-gray-100 dark:border-gray-700">
                                                {inquiry.sender_tel && (
                                                    <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                                                        <Phone className="w-4 h-4 text-emerald-500" /> {inquiry.sender_tel}
                                                    </div>
                                                )}
                                                {inquiry.sender_email && (
                                                    <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                                                        <Mail className="w-4 h-4 text-orange-500" /> {inquiry.sender_email}
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Button 
                            variant="ghost" 
                            onClick={() => {
                                setEditingProperty(null);
                                setActiveTab('LIST');
                                fetchProperties(); 
                            }} 
                            className="mb-4 text-gray-500"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" /> ยกเลิก / กลับไปหน้ารายการ
                        </Button>
                        <AddListingForm property={editingProperty} isEdit={!!editingProperty} />
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
            <AnnouncementBanner />
            
            {/* 🟢 เรียกใช้ VerificationForm ที่เราเพิ่งเขียนเสร็จ! */}
            <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <VerificationForm />
            </div>
        </div>
    );
}