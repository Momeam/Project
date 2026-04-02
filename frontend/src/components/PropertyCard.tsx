'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, DoorOpen, Ruler, Eye } from 'lucide-react'

// 🟢 ปรับ Type ให้รองรับข้อมูลที่มาจาก Database
export function PropertyCard({ property }: { property: any }) {
    const pricePerSqm = property.size > 0 ? property.price / property.size : 0
    
    // 🟢 ดัก Error: ตรวจสอบว่ามี images ไหม และความยาวมากกว่า 0 หรือเปล่า
    const hasImages = property.images && property.images.length > 0;

    return (
        <Link href={`/property/${property.id}`}>
            <Card className="overflow-hidden hover:shadow-lg transition-shadow dark:bg-gray-800 cursor-pointer h-full">
                {/* ภาพ */}
                <div className="relative w-full h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    {hasImages ? (
                        <img
                            src={property.images[0].url || property.images[0]} 
                            alt={property.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-300 dark:bg-gray-600">
                            <span className="text-gray-500 font-medium">รออัปเดตรูปภาพ</span>
                        </div>
                    )}

                    {/* Badge ประเภท */}
                    <div className="absolute top-2 right-2">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-white shadow-md ${
                            property.type === 'SALE' ? 'bg-emerald-500' : 'bg-blue-500'
                        }`}>
                            {property.type === 'SALE' ? 'ขาย' : 'เช่า'}
                        </span>
                    </div>

                    {/* แสดงจำนวนภาพ */}
                    {hasImages && property.images.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs backdrop-blur-sm">
                            📷 {property.images.length}
                        </div>
                    )}
                </div>

                {/* เนื้อหา */}
                <CardContent className="p-4 space-y-3">
                    {/* ชื่อ */}
                    <div>
                        <h3 className="font-semibold text-lg line-clamp-2 hover:text-emerald-600 transition-colors">
                            {property.title}
                        </h3>
                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm mt-1">
                            <MapPin className="w-4 h-4 text-rose-500" />
                            <span className="line-clamp-1">{property.address || '-'} {property.province || property.district}</span>
                        </div>
                    </div>

                    {/* ราคา */}
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">ราคา</p>
                        <p className="text-xl font-bold text-slate-900 dark:text-white">
                            ฿{property.price?.toLocaleString('th-TH') || 0}
                        </p>
                        {property.size > 0 && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                ฿{pricePerSqm.toLocaleString('th-TH', { maximumFractionDigits: 0 })} / ตร.ม.
                            </p>
                        )}
                    </div>

                    {/* ข้อมูลอสังหาริมทรัพย์ */}
                    <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg">
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