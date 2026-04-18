'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, DoorOpen, Ruler, Heart } from 'lucide-react'
import { useFavoriteStore } from '@/stores/useFavoriteStore'
import { useAuthStore } from '@/stores/useAuthStore'

// 🟢 ปรับ Type ให้รองรับข้อมูลที่มาจาก Database
export function PropertyCard({ property }: { property: any }) {
    const pricePerSqm = property.size > 0 ? property.price / property.size : 0
    const hasImages = property.images && property.images.length > 0;

    const toggleFavorite = useFavoriteStore((s) => s.toggleFavorite);
    const isFavorite = useFavoriteStore((s) => s.isFavorite);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    
    const liked = isFavorite(String(property.id));

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.preventDefault(); // ป้องกันไม่ให้ลิงก์ทำงาน
        e.stopPropagation();
        toggleFavorite(String(property.id));
    };

    // 🟢 โค้ดแก้บัครูปภาพ! (ดึงรูปจาก Backend พอร์ต 5000 อัตโนมัติ)
    let displayImage = '';
    if (hasImages) {
        const rawImg = property.images[0].url || property.images[0];
        if (typeof rawImg === 'string' && rawImg.startsWith('/uploads')) {
            displayImage = `http://localhost:5000${rawImg}`;
        } else {
            displayImage = rawImg;
        }
    }

    return (
        <Link href={`/property/${property.id}`}>
            <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 dark:bg-gray-800 cursor-pointer h-full group border-slate-200/80 dark:border-white/5">
                {/* ภาพ */}
                <div className="relative w-full h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    {hasImages ? (
                        <img
                            src={displayImage} 
                            alt={property.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600">
                            <span className="text-slate-400 dark:text-slate-500 font-medium text-sm">รออัปเดตรูปภาพ</span>
                        </div>
                    )}

                    {/* Badge ประเภท */}
                    <div className="absolute top-3 left-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg backdrop-blur-sm ${
                            property.type === 'SALE' ? 'bg-emerald-500/90' : 'bg-blue-500/90'
                        }`}>
                            {property.type === 'SALE' ? 'ขาย' : 'เช่า'}
                        </span>
                    </div>

                    {/* ❤️ ปุ่มกดรายการโปรด */}
                    {isAuthenticated && (
                        <button
                            onClick={handleFavoriteClick}
                            className={`absolute top-3 right-3 p-2 rounded-full shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-110 active:scale-95 ${
                                liked 
                                    ? 'bg-rose-500 text-white shadow-rose-500/30' 
                                    : 'bg-white/80 dark:bg-black/40 text-slate-400 hover:text-rose-500 hover:bg-white dark:hover:bg-black/60'
                            }`}
                            title={liked ? 'ลบออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'}
                        >
                            <Heart className={`w-4 h-4 transition-all ${liked ? 'fill-white' : ''}`} />
                        </button>
                    )}

                    {/* แสดงจำนวนภาพ */}
                    {hasImages && property.images.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded-lg text-xs backdrop-blur-sm font-medium">
                            📷 {property.images.length}
                        </div>
                    )}
                </div>

                {/* เนื้อหา */}
                <CardContent className="p-4 space-y-3">
                    {/* ชื่อ */}
                    <div>
                        <h3 className="font-semibold text-lg line-clamp-2 text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {property.title}
                        </h3>
                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm mt-1">
                            <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0" />
                            <span className="line-clamp-1">{property.address || '-'} {property.province || property.district}</span>
                        </div>
                    </div>

                    {/* ราคา */}
                    <div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">ราคา</p>
                        <p className="text-xl font-bold text-slate-900 dark:text-white">
                            ฿{property.price?.toLocaleString('th-TH') || 0}
                            {property.type === 'RENT' && <span className="text-sm font-normal text-slate-400"> /เดือน</span>}
                        </p>
                        {property.size > 0 && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                ฿{pricePerSqm.toLocaleString('th-TH', { maximumFractionDigits: 0 })} / ตร.ม.
                            </p>
                        )}
                    </div>

                    {/* ข้อมูลอสังหาริมทรัพย์ */}
                    <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl">
                        {property.size > 0 && (
                            <div className="flex items-center gap-1.5">
                                <Ruler className="w-4 h-4 text-slate-400" />
                                <span className="font-medium">{property.size} ตร.ม.</span>
                            </div>
                        )}

                        {property.bedrooms > 0 && (
                            <div className="flex items-center gap-1.5">
                                <DoorOpen className="w-4 h-4 text-slate-400" />
                                <span className="font-medium">{property.bedrooms} ห้อง</span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}