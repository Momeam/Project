'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Property } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, DoorOpen, Ruler, Eye, Heart, Share2 } from 'lucide-react'
import { useFavoriteStore } from '@/stores/useFavoriteStore'

interface PropertyCardProps {
    property: Property
}

export function PropertyCard({ property }: PropertyCardProps) {
    const pricePerSqm = property.size > 0 ? property.price / property.size : 0
    const { favoriteIds, toggleFavorite } = useFavoriteStore()
    const isFavorite = favoriteIds.has(property.id)

    const handleShare = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const shareUrl = `${window.location.origin}/listings/${property.id}`;
        const shareData = {
            title: property.title,
            text: `ชมประกาศ ${property.title} บน HomeLink`,
            url: shareUrl,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Share failed:', err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareUrl);
                alert('คัดลอกลิงก์ไปยังคลิปบอร์ดแล้ว! คุณสามารถนำไปแชร์ต่อใน Facebook, Line หรือ IG ได้ทันที 🏠✨');
            } catch (err) {
                console.error('Clipboard copy failed:', err);
            }
        }
    };

    return (
        <Link href={`/property/${property.id}`}>
            <Card className="overflow-hidden hover:shadow-lg transition-shadow dark:bg-gray-800 cursor-pointer h-full relative group">
                {/* ปุ่มกดใจ */}
                <button 
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFavorite(property.id);
                    }}
                    className="absolute top-2 left-2 z-20 bg-white/80 dark:bg-black/40 backdrop-blur-md p-2 rounded-full shadow-sm hover:scale-110 transition-transform border border-gray-100 dark:border-gray-700"
                >
                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                </button>

                {/* ปุ่มแชร์ */}
                <button 
                    onClick={handleShare}
                    className="absolute top-2 left-12 z-20 bg-white/80 dark:bg-black/40 backdrop-blur-md p-2 rounded-full shadow-sm hover:scale-110 transition-transform border border-gray-100 dark:border-gray-700"
                >
                    <Share2 className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                </button>

                {/* ภาพ */}
                <div className="relative w-full h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    {property.images.length > 0 ? (
                        <Image
                            src={property.images[0].url}
                            alt={property.title}
                            fill
                            className="object-cover hover:scale-105 transition-transform"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-300 dark:bg-gray-600">
                            <span className="text-gray-500">ไม่มีภาพ</span>
                        </div>
                    )}

                    {/* Badge ประเภท */}
                    <div className="absolute top-2 right-2">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-white ${
                            property.status === 'SOLD' ? 'bg-red-500' :
                            property.status === 'BOOKED' ? 'bg-orange-500' :
                            property.type === 'SALE' ? 'bg-green-500' : 'bg-blue-500'
                        }`}>
                            {property.status === 'SOLD' ? '🤝 ซื้อขายแล้ว' : 
                             property.status === 'BOOKED' ? '📅 จองแล้ว' : 
                             property.type === 'SALE' ? '🏷️ ขาย' : '🔑 เช่า'}
                        </span>
                    </div>

                    {/* แสดงจำนวนภาพ */}
                    {property.images.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
                            📷 {property.images.length}
                        </div>
                    )}
                </div>

                {/* เนื้อหา */}
                <CardContent className="p-4 space-y-3">
                    {/* ชื่อ */}
                    <div>
                        <h3 className="font-semibold text-lg line-clamp-2 hover:text-blue-500">
                            {property.title}
                        </h3>
                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm mt-1">
                            <MapPin className="w-4 h-4" />
                            <span className="line-clamp-1">{property.district}, {property.province}</span>
                        </div>
                    </div>

                    {/* ราคา */}
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">ราคา</p>
                        <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            ฿{property.price.toLocaleString('th-TH')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                            ฿{pricePerSqm.toLocaleString('th-TH', { maximumFractionDigits: 0 })} / ตร.ม.
                        </p>
                    </div>

                    {/* ข้อมูลอสังหาริมทรัพย์ */}
                    <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                        {property.size > 0 && (
                            <div className="flex items-center gap-1">
                                <Ruler className="w-4 h-4" />
                                <span>{property.size} ตร.ม.</span>
                            </div>
                        )}

                        {property.bedrooms > 0 && (
                            <div className="flex items-center gap-1">
                                <DoorOpen className="w-4 h-4" />
                                <span>{property.bedrooms} ห้อง</span>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            <span>{property.viewCount} views</span>
                        </div>
                        <div className="text-right">
                            {new Date(property.createdAt).toLocaleDateString('th-TH')}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}
