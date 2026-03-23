'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePropertyStore } from '@/stores/usePropertyStore';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MapPin, Bed, Bath, Ruler, Search } from 'lucide-react';

export default function BuyPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const properties = usePropertyStore((state) => state.properties);

    // ⭐️ Logic กรอง: เอาเฉพาะ "ขาย" (SALE)
    const filteredProperties = useMemo(() => {
        return properties.filter((p) => {
            const isActive = p.status === 'ACTIVE';
            const isSale = p.type === 'SALE'; // 👈 กรองตรงนี้
            const query = searchQuery.toLowerCase();
            const matchesSearch = 
                p.title.toLowerCase().includes(query) || 
                p.address.toLowerCase().includes(query) ||
                p.province.toLowerCase().includes(query);

            return isActive && isSale && matchesSearch;
        });
    }, [properties, searchQuery]);

    return (
        <div className="container mx-auto p-4 md:py-8 max-w-7xl">
            {/* Header ค้นหา (ดีไซน์เดียวกับหน้าแรก) */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8">
                <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">ค้นหาอสังหาฯ สำหรับ "ซื้อ"</h1>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input 
                        placeholder="พิมพ์ชื่อโครงการ, ย่าน, หรือจังหวัด..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-12 text-lg"
                    />
                </div>
                <p className="text-sm text-gray-500 mt-2 text-right">พบประกาศ {filteredProperties.length} รายการ</p>
            </div>

            {/* Grid แสดงผล */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProperties.length > 0 ? (
                    filteredProperties.map((property) => (
                        <Link href={`/listings/${property.id}`} key={property.id} className="group">
                            <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 h-full group-hover:-translate-y-1">
                                <div className="aspect-video bg-gray-200 relative overflow-hidden">
                                    <img 
                                        src={property.images[0]?.url || 'https://placehold.co/600x400?text=No+Image'} 
                                        alt={property.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    {/* ⭐️ ป้าย "ขาย" สีเขียว */}
                                    <span className="absolute top-3 right-3 bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                                        ขาย
                                    </span>
                                </div>
                                <CardContent className="p-5">
                                    <h3 className="font-bold text-lg line-clamp-1 mb-2 text-gray-800 dark:text-white group-hover:text-green-600 transition-colors">
                                        {property.title}
                                    </h3>
                                    <div className="flex items-baseline gap-1 mb-3">
                                        <p className="text-red-600 font-bold text-xl">฿{property.price.toLocaleString()}</p>
                                    </div>
                                    <div className="flex items-center text-gray-500 text-sm mb-4">
                                        <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                                        <span className="line-clamp-1">{property.address}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300">
                                        <span className="flex items-center gap-1"><Bed className="w-4 h-4"/> {property.bedrooms} นอน</span>
                                        <span className="flex items-center gap-1"><Bath className="w-4 h-4"/> {property.bathrooms} น้ำ</span>
                                        <span className="flex items-center gap-1"><Ruler className="w-4 h-4"/> {property.size} ตร.ม.</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed">
                        <p className="text-lg">ไม่พบประกาศสำหรับขายในขณะนี้</p>
                    </div>
                )}
            </div>
        </div>
    );
}