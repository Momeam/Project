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
        <div className="min-h-screen bg-slate-950 text-slate-50 pt-32 pb-20">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Header ค้นหา (Premium Dark Design) */}
                <div className="bg-slate-900/60 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-slate-800 mb-10">
                    <h1 className="text-3xl font-bold mb-6 text-white tracking-tight">ค้นหาอสังหาฯ สำหรับ <span className="text-emerald-400">"ซื้อ"</span></h1>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6" />
                        <Input 
                            placeholder="พิมพ์ชื่อโครงการ, ย่าน, หรือจังหวัด..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 h-14 text-lg bg-slate-950/50 border-slate-700 text-white placeholder:text-slate-500 rounded-2xl focus-visible:ring-emerald-500/50"
                        />
                    </div>
                    <p className="text-sm text-slate-400 mt-4 text-right font-medium">พบประกาศ <span className="text-emerald-400 font-bold">{filteredProperties.length}</span> รายการ</p>
                </div>

                {/* Grid แสดงผล */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredProperties.length > 0 ? (
                        filteredProperties.map((property) => (
                            <Link href={`/listings/${property.id}`} key={property.id} className="group">
                                <Card className="overflow-hidden border border-slate-800 bg-slate-900/40 backdrop-blur-sm shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-500/30 transition-all duration-500 h-full group-hover:-translate-y-2">
                                    <div className="aspect-video bg-slate-800 relative overflow-hidden">
                                        <img 
                                            src={property.images[0]?.url || 'https://placehold.co/600x400?text=No+Image'} 
                                            alt={property.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
                                        <span className="absolute top-4 right-4 bg-emerald-500/90 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg border border-emerald-400/20">
                                            ขาย
                                        </span>
                                    </div>
                                    <CardContent className="p-6">
                                        <h3 className="font-bold text-xl line-clamp-1 mb-3 text-white group-hover:text-emerald-400 transition-colors">
                                            {property.title}
                                        </h3>
                                        <div className="flex items-baseline gap-1 mb-4">
                                            <p className="text-emerald-400 font-bold text-2xl tracking-tight">฿{property.price.toLocaleString()}</p>
                                        </div>
                                        <div className="flex items-center text-slate-400 text-sm mb-6">
                                            <MapPin className="w-4 h-4 mr-2 flex-shrink-0 text-emerald-500" />
                                            <span className="line-clamp-1">{property.address}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-5 border-t border-slate-800 text-sm text-slate-300 font-medium">
                                            <span className="flex items-center gap-1.5"><Bed className="w-4 h-4 text-emerald-500/70"/> {property.bedrooms} นอน</span>
                                            <span className="flex items-center gap-1.5"><Bath className="w-4 h-4 text-emerald-500/70"/> {property.bathrooms} น้ำ</span>
                                            <span className="flex items-center gap-1.5"><Ruler className="w-4 h-4 text-emerald-500/70"/> {property.size} ตร.ม.</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))
                    ) : (
                        <div className="col-span-full flex flex-col items-center justify-center py-24 text-slate-500 bg-slate-900/20 rounded-3xl border-2 border-slate-800 border-dashed">
                            <Search className="w-12 h-12 mb-4 text-slate-700" />
                            <p className="text-xl font-medium">ไม่พบประกาศสำหรับขายในขณะนี้</p>
                            <p className="text-sm mt-2">ลองเปลี่ยนคำค้นหาเพื่อพบประกาศที่ใช่</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}