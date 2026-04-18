'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePropertyStore } from '@/stores/usePropertyStore';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Bed, Bath, Ruler, Phone, Mail, MessageSquare, ArrowLeft, BadgeCheck } from 'lucide-react';

export default function SellerProfilePage() {
    const params = useParams();
    const router = useRouter();
    const sellerId = params.id as string;

    // 1. ดึงข้อมูลผู้ขาย
    const { usersList: users, fetchUsers } = useAuthStore();
    
    React.useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const seller = useMemo(() => users.find(u => String(u.id) === String(sellerId)), [users, sellerId]);

    // 2. ดึงประกาศของผู้ขายคนนี้
    const allListings = usePropertyStore((state) => state.properties);
    const sellerListings = useMemo(() => {
        return allListings.filter(p => String(p.userId) === String(sellerId) && p.status === 'ACTIVE');
    }, [allListings, sellerId]);

    if (!seller) {
        return <div className="p-20 text-center text-slate-500">ไม่พบข้อมูลผู้ขายรายนี้</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50/50 pt-24">
            {/* Banner / Cover */}
            <div className="h-48 bg-slate-900 w-full relative">
                <div className="absolute top-4 left-4">
                    <Button variant="ghost" onClick={() => router.back()} className="text-white hover:bg-white/20">
                        <ArrowLeft className="w-4 h-4 mr-2" /> ย้อนกลับ
                    </Button>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-6xl -mt-20 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* --- ซ้าย: ข้อมูลโปรไฟล์ (Sidebar) --- */}
                    <div className="lg:col-span-1">
                        <Card className="shadow-xl border-0 rounded-2xl overflow-hidden sticky top-24">
                            <CardContent className="p-6 text-center pt-10 relative">
                                {/* Avatar */}
                                <div className="absolute -top-16 left-1/2 -translate-x-1/2">
                                    <div className="w-32 h-32 rounded-full border-4 border-white bg-slate-100 overflow-hidden shadow-md">
                                        <img 
                                            src={`https://ui-avatars.com/api/?name=${seller.username}&background=random`} 
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>

                                <div className="mt-8 mb-6">
                                    <h1 className="text-2xl font-bold text-slate-900 flex items-center justify-center gap-2">
                                        {seller.full_name || seller.username}
                                        <BadgeCheck className="w-6 h-6 text-emerald-500" />
                                    </h1>
                                    <p className="text-slate-500">สมาชิก: {seller.id}</p>
                                    <div className="mt-2 inline-block bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold">
                                        ผู้ขายยืนยันตัวตนแล้ว
                                    </div>
                                </div>

                                <div className="space-y-4 text-left border-t pt-6">
                                    <h3 className="font-semibold text-slate-900">ข้อมูลติดต่อ</h3>
                                    <div className="flex items-center text-slate-600 gap-3">
                                        <div className="p-2 bg-slate-100 rounded-lg"><Phone className="w-4 h-4"/></div>
                                        <span>{seller.tel || '-'}</span>
                                    </div>
                                    <div className="flex items-center text-slate-600 gap-3">
                                        <div className="p-2 bg-slate-100 rounded-lg"><MessageSquare className="w-4 h-4"/></div>
                                        <span>Line: {seller.line_id || '-'}</span>
                                    </div>
                                    <div className="flex items-center text-slate-600 gap-3">
                                        <div className="p-2 bg-slate-100 rounded-lg"><Mail className="w-4 h-4"/></div>
                                        <span className="truncate">{seller.email}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* --- ขวา: รายการประกาศ (Timeline) --- */}
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center">
                            ประกาศทั้งหมด <span className="ml-2 bg-slate-200 text-slate-600 text-xs px-2 py-1 rounded-full">{sellerListings.length}</span>
                        </h2>

                        {sellerListings.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {sellerListings.map((property) => (
                                    <Link href={`/listings/${property.id}`} key={property.id} className="group">
                                        <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 h-full group-hover:-translate-y-1">
                                            <div className="aspect-[4/3] bg-gray-200 relative overflow-hidden">
                                                <img 
                                                    src={
                                                        (() => {
                                                            const url = property.images?.[0]?.url || '';
                                                            if (url.startsWith('/uploads')) return `http://localhost:5000${url}`;
                                                            return url || 'https://placehold.co/600x400?text=No+Image';
                                                        })()
                                                    }
                                                    alt={property.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                                <span className={`absolute top-3 right-3 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm ${
                                                    property.type === 'SALE' ? 'bg-green-600' : 'bg-blue-600'
                                                }`}>
                                                    {property.type === 'SALE' ? 'ขาย' : 'เช่า'}
                                                </span>
                                            </div>
                                            
                                            <CardContent className="p-5">
                                                <h3 className="font-bold text-lg line-clamp-1 mb-2 text-gray-800 dark:text-white group-hover:text-blue-600 transition-colors">
                                                    {property.title}
                                                </h3>
                                                <div className="flex items-baseline gap-1 mb-3">
                                                    <p className="text-red-600 font-bold text-xl">฿{property.price.toLocaleString()}</p>
                                                    {property.type === 'RENT' && <span className="text-sm text-gray-500">/ เดือน</span>}
                                                </div>
                                                <div className="flex items-center text-gray-500 text-sm mb-4">
                                                    <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                                                    <span className="line-clamp-1">{property.address}</span>
                                                </div>
                                                <div className="flex justify-between items-center pt-4 border-t text-sm text-gray-600">
                                                    <span className="flex items-center gap-1"><Bed className="w-4 h-4"/> {property.bedrooms}</span>
                                                    <span className="flex items-center gap-1"><Bath className="w-4 h-4"/> {property.bathrooms}</span>
                                                    <span className="flex items-center gap-1"><Ruler className="w-4 h-4"/> {property.size} ม²</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="p-10 text-center bg-white rounded-xl border border-dashed">
                                <p className="text-slate-400">ผู้ขายรายนี้ยังไม่มีประกาศที่ออนไลน์อยู่ในขณะนี้</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}