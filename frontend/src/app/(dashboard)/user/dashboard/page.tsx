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
    
    // 🟢 ดึงข้อมูลแบบปลอดภัย 100% (รองรับทั้ง currentUser และ user ของคุณ)
    const currentUser = useAuthStore((state: any) => state.currentUser);
    const legacyUser = useAuthStore((state: any) => state.user);
    const user = currentUser || legacyUser;
    
    const userId = user?.id;
    const role = user?.role;
    
    const justUpgraded = useAuthStore((state: any) => state.justUpgraded); 

    const { inquiries, fetchInquiries, isLoading: isLoadingInquiries } = useInquiryStore();

    // ดึงข้อมูล Property จาก API
    const allListings = usePropertyStore((state: any) => state.properties || []);
    const fetchProperties = usePropertyStore((state: any) => state.fetchProperties);

    useEffect(() => {
        setIsMounted(true);
        if (fetchProperties) fetchProperties();
        
        // เช็คให้ครอบคลุมทุกอาชีพที่อยู่ในฟอร์มของคุณ
        if ((role === 'SELLER' || role === 'ADMIN' || role === 'DEVELOPER' || role === 'AGENT') && fetchInquiries) {
            fetchInquiries();
        }
    }, [role, fetchProperties, fetchInquiries]);

    const myListings = useMemo(() => {
        if (!userId || !Array.isArray(allListings)) return [];
        return allListings.filter((p: any) => String(p.userId) === String(userId));
    }, [allListings, userId]);

    const [activeTab, setActiveTab] = useState<'LIST' | 'ADD' | 'INQUIRIES'>('LIST');

    // ระบบลบประกาศ 
    const handleDelete = async (id: string) => {
        if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบประกาศนี้? 🗑️")) {
            try {
                const response = await fetch(`http://localhost:5000/api/properties/${id}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    alert('ลบประกาศออกจากฐานข้อมูลสำเร็จ! ✅');
                    if (fetchProperties) fetchProperties(); 
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

    // =======================================================
    // 0. ส่วนแสดงผล ป๊อปอัปเซอร์ไพรส์ 
    // =======================================================
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
                        </div>

                        <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">เซอร์ไพรส์! 🎉</h2>
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-5 rounded-2xl mb-8 shadow-lg transform -rotate-1">
                            <p className="text-white font-black text-2xl drop-shadow-md">
                                ยินดีด้วยคุณได้อัปเกรดสำเร็จ!
                            </p>
                        </div>
                        
                        <p className="text-slate-500 mb-10 text-base leading-relaxed font-medium">
                            เราได้เปิดระบบให้คุณแล้ว <br/>
                            เริ่มสร้างรายได้จากอสังหาริมทรัพย์ของคุณได้ทันที!
                        </p>

                        <Button 
                            onClick={() => useAuthStore.setState({ justUpgraded: false })} 
                            className="w-full h-16 bg-slate-900 hover:bg-black text-white text-xl font-black rounded-2xl shadow-2xl transition-all hover:scale-[1.05] active:scale-[0.95] flex items-center justify-center gap-3"
                        >
                            เข้าสู่ระบบ <RefreshCcw className="w-5 h-5" />
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // =======================================================
    // 1. ส่วนแสดงผลสำหรับ ผู้ขาย
    // =======================================================
    if (role === 'SELLER' || role === 'ADMIN' || role === 'DEVELOPER' || role === 'AGENT') {
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
                            onClick={() => { setActiveTab('LIST'); setEditingProperty(null); if(fetchProperties) fetchProperties(); }}
                            className="whitespace-nowrap"
                        >
                            <List className="w-4 h-4 mr-2" /> รายการของฉัน ({myListings.length})
                        </Button>
                        <Link href="/inbox">
                            <Button 
                                variant="outline"
                                className="whitespace-nowrap bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                            >
                                <MessageSquare className="w-4 h-4 mr-2" /> กล่องข้อความแชท
                            </Button>
                        </Link>
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
                                {myListings.map((item: any) => {
                                    
                                    // โค้ดแก้บัครูปภาพ! (ดึงจากพอร์ต 5000 อัตโนมัติ)
                                    let imageUrl = 'https://placehold.co/150?text=No+Img';
                                    if (item.images && item.images.length > 0) {
                                        const rawUrl = item.images[0].url || item.images[0];
                                        if (typeof rawUrl === 'string' && rawUrl.startsWith('/uploads')) {
                                            imageUrl = `http://localhost:5000${rawUrl}`;
                                        } else {
                                            imageUrl = rawUrl;
                                        }
                                    }

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
                                                    <Link href={`/property/${item.id}`} target="_blank">
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
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Button 
                            variant="ghost" 
                            onClick={() => {
                                setEditingProperty(null);
                                setActiveTab('LIST');
                                if(fetchProperties) fetchProperties(); 
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

    // =======================================================
    // 2. ส่วนแสดงผลสำหรับ USER (ยังไม่อนุมัติ / รอตรวจสอบ)
    // =======================================================
    return (
        <div className="container mx-auto p-4 md:py-8 max-w-4xl">
            <AnnouncementBanner />
            
            <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <VerificationForm />
            </div>
        </div>
    );
}