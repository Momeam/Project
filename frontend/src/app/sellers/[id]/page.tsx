'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Bed, Bath, Ruler, Phone, Mail, MessageSquare, ArrowLeft, BadgeCheck, Building2, Home, Briefcase, Loader2, Calendar } from 'lucide-react';

const SELLER_TYPE_MAP: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
    DEVELOPER: { label: 'เจ้าของอสังหา', icon: Building2, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800' },
    OWNER: { label: 'เจ้าของบ้าน', icon: Home, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800' },
    AGENT: { label: 'นายหน้า', icon: Briefcase, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800' },
};

export default function SellerProfilePage() {
    const params = useParams();
    const router = useRouter();
    const sellerId = params.id as string;

    const [seller, setSeller] = useState<any>(null);
    const [sellerListings, setSellerListings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // 🟢 ดึงข้อมูลผู้ขาย + ประกาศของเขาจาก API สาธารณะ
    useEffect(() => {
        if (!sellerId) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                // ดึงข้อมูลผู้ขาย
                const sellerRes = await fetch(`/api/users/sellers/${sellerId}`);
                if (sellerRes.ok) {
                    const sellerData = await sellerRes.json();
                    setSeller(sellerData);
                }

                // ดึงประกาศของผู้ขายคนนี้
                const propsRes = await fetch(`/api/properties/seller/${sellerId}`);
                if (propsRes.ok) {
                    const propsData = await propsRes.json();
                    setSellerListings(propsData);
                }
            } catch (error) {
                console.error('Error fetching seller data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [sellerId]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                <span className="ml-3 text-slate-500">กำลังโหลดข้อมูลผู้ขาย...</span>
            </div>
        );
    }

    if (!seller) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 gap-4">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">ไม่พบข้อมูลผู้ขายรายนี้</h1>
                <p className="text-slate-500">ผู้ขายอาจไม่ได้ลงทะเบียนหรือยังไม่ผ่านการยืนยันตัวตน</p>
                <Button onClick={() => router.push('/sellers')}>กลับไปหน้าค้นหาผู้ขาย</Button>
            </div>
        );
    }

    const typeInfo = SELLER_TYPE_MAP[seller.seller_type] || SELLER_TYPE_MAP.OWNER;
    const TypeIcon = typeInfo.icon;

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pt-24">
            {/* Banner / Cover */}
            <div className="h-48 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900 w-full relative">
                <div className="absolute top-4 left-4">
                    <Button variant="ghost" onClick={() => router.back()} className="text-white hover:bg-white/20">
                        <ArrowLeft className="w-4 h-4 mr-2" /> ย้อนกลับ
                    </Button>
                </div>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent"></div>
            </div>

            <div className="container mx-auto px-4 max-w-6xl -mt-20 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* --- ซ้าย: ข้อมูลโปรไฟล์ (Sidebar) --- */}
                    <div className="lg:col-span-1">
                        <Card className="shadow-xl border-0 rounded-2xl overflow-hidden sticky top-24 dark:bg-slate-900">
                            <CardContent className="p-6 text-center pt-10 relative">
                                {/* Avatar */}
                                <div className="absolute -top-16 left-1/2 -translate-x-1/2">
                                    <div className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-md">
                                        <img 
                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(seller.full_name || seller.username)}&background=random&bold=true&size=128`} 
                                            className="w-full h-full object-cover"
                                            alt={seller.full_name || seller.username}
                                        />
                                    </div>
                                </div>

                                <div className="mt-8 mb-6">
                                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">
                                        {seller.full_name || seller.username}
                                        <BadgeCheck className="w-6 h-6 text-emerald-500" />
                                    </h1>
                                    
                                    {/* ⭐️ แสดงฐานะผู้ขาย */}
                                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold border mt-3 ${typeInfo.bg} ${typeInfo.color}`}>
                                        <TypeIcon className="w-4 h-4" />
                                        {typeInfo.label}
                                    </div>

                                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 flex items-center justify-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" />
                                        สมาชิกตั้งแต่: {seller.createdat ? new Date(seller.createdat).toLocaleDateString('th-TH', { year: 'numeric', month: 'long' }) : '-'}
                                    </p>
                                </div>

                                <div className="space-y-4 text-left border-t dark:border-slate-800 pt-6">
                                    <h3 className="font-semibold text-slate-900 dark:text-white">ข้อมูลติดต่อ</h3>
                                    <div className="flex items-center text-slate-600 dark:text-slate-300 gap-3">
                                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg"><Phone className="w-4 h-4"/></div>
                                        <span>{seller.tel || '-'}</span>
                                    </div>
                                    <div className="flex items-center text-slate-600 dark:text-slate-300 gap-3">
                                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg"><MessageSquare className="w-4 h-4"/></div>
                                        <span>Line: {seller.line_id || '-'}</span>
                                    </div>
                                    <div className="flex items-center text-slate-600 dark:text-slate-300 gap-3">
                                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg"><Mail className="w-4 h-4"/></div>
                                        <span className="truncate">{seller.email}</span>
                                    </div>
                                </div>

                                {/* สถิติ */}
                                <div className="mt-6 pt-6 border-t dark:border-slate-800 grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-center">
                                        <p className="text-2xl font-black text-slate-900 dark:text-white">{sellerListings.length}</p>
                                        <p className="text-xs text-slate-500">ประกาศทั้งหมด</p>
                                    </div>
                                    <div className="bg-emerald-50 dark:bg-emerald-950 p-3 rounded-xl text-center">
                                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                            {sellerListings.filter(p => p.status === 'ACTIVE').length}
                                        </p>
                                        <p className="text-xs text-slate-500">ประกาศออนไลน์</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* --- ขวา: รายการประกาศ --- */}
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                            ประกาศทั้งหมด <span className="ml-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-2 py-1 rounded-full">{sellerListings.length}</span>
                        </h2>

                        {sellerListings.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {sellerListings.map((property: any) => {
                                    let imageUrl = 'https://placehold.co/600x400?text=No+Image';
                                    if (property.images && property.images.length > 0) {
                                        const url = property.images[0].url || property.images[0];
                                        if (typeof url === 'string' && url.startsWith('/uploads')) {
                                            imageUrl = `http://localhost:5000${url}`;
                                        } else if (url) {
                                            imageUrl = url;
                                        }
                                    }

                                    return (
                                        <Link href={`/listings/${property.id}`} key={property.id} className="group">
                                            <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 h-full group-hover:-translate-y-1 dark:bg-slate-900">
                                                <div className="aspect-[4/3] bg-gray-200 dark:bg-slate-800 relative overflow-hidden">
                                                    <img 
                                                        src={imageUrl}
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
                                                        <p className="text-red-600 font-bold text-xl">฿{Number(property.price || 0).toLocaleString()}</p>
                                                        {property.type === 'RENT' && <span className="text-sm text-gray-500">/ เดือน</span>}
                                                    </div>
                                                    <div className="flex items-center text-gray-500 dark:text-slate-400 text-sm mb-4">
                                                        <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                                                        <span className="line-clamp-1">{property.address}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center pt-4 border-t dark:border-slate-700 text-sm text-gray-600 dark:text-slate-400">
                                                        <span className="flex items-center gap-1"><Bed className="w-4 h-4"/> {property.bedrooms || 0}</span>
                                                        <span className="flex items-center gap-1"><Bath className="w-4 h-4"/> {property.bathrooms || 0}</span>
                                                        <span className="flex items-center gap-1"><Ruler className="w-4 h-4"/> {property.size || 0} ม²</span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed dark:border-slate-700">
                                <p className="text-slate-400">ผู้ขายรายนี้ยังไม่มีประกาศที่ออนไลน์อยู่ในขณะนี้</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}