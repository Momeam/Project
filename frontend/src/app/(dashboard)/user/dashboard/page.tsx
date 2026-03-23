'use client';

import React, { useState, useMemo } from 'react';
import VerificationForm from '@/components/VerificationForm'; 
import AddListingForm from '@/components/AddListingForm';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePropertyStore } from '@/stores/usePropertyStore'; 
import Link from 'next/link';
import { Clock, XCircle, Plus, List, Trash2, Eye, ArrowLeft } from 'lucide-react'; 
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function UserDashboardPage() {
    
    const verificationStatus = useAuthStore((state) => state.verificationStatus);
    const userId = useAuthStore((state) => state.userId);

    const allListings = usePropertyStore((state) => state.properties);
    const deleteProperty = usePropertyStore((state) => state.deleteProperty);

    const myListings = useMemo(() => {
        if (!userId) return [];
        return allListings.filter(p => p.userId === userId);
    }, [allListings, userId]);

    const [activeTab, setActiveTab] = useState<'LIST' | 'ADD'>('LIST');

    const handleDelete = (id: string) => {
        if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบประกาศนี้?")) {
            deleteProperty(id, userId || '', 'SELLER');
        }
    };

    // -------------------------------------------------------
    // 1. ส่วนแสดงผลสำหรับ SELLER (อนุมัติแล้ว)
    // -------------------------------------------------------
    if (verificationStatus === 'APPROVED') {
        return (
            <div className="container mx-auto p-4 md:py-8 max-w-5xl">
                
                {/* 🗑️ ลบแถบเมนูนำทางด้านบนออกไปแล้ว */}

                {/* Header Dashboard */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Seller Dashboard
                    </h1>
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
            
            {/* 🗑️ ลบแถบเมนูนำทางด้านบนออกไปแล้ว */}
            
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