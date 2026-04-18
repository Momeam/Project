'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePropertyStore } from '@/stores/usePropertyStore';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MapPin, Bed, Bath, Ruler, Search } from 'lucide-react';

function getImageUrl(images: any): string {
    try {
        let imgs = images;
        if (typeof imgs === 'string') imgs = JSON.parse(imgs);
        if (typeof imgs === 'string') imgs = JSON.parse(imgs);
        if (Array.isArray(imgs) && imgs.length > 0) {
            const raw = imgs[0]?.url || imgs[0]?.image_url || imgs[0] || '';
            const cleaned = String(raw).replace(/^["']|["']$/g, '');
            if (cleaned.startsWith('http')) return cleaned;
            if (cleaned.startsWith('/uploads')) return `http://localhost:5000${cleaned}`;
            if (cleaned) return `http://localhost:5000/uploads/${cleaned}`;
        }
    } catch {}
    return 'https://placehold.co/600x400?text=No+Image';
}

export default function BuyPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const properties = usePropertyStore((state) => state.properties);

    const filteredProperties = useMemo(() => {
        return properties.filter((p) => {
            const isVisible = ['ACTIVE', 'SOLD', 'BOOKED'].includes(p.status);
            const isSale = p.type === 'SALE';
            const query = searchQuery.toLowerCase();
            const matchesSearch = 
                p.title.toLowerCase().includes(query) || 
                p.address.toLowerCase().includes(query) ||
                p.province.toLowerCase().includes(query);
            return isVisible && isSale && matchesSearch;
        });
    }, [properties, searchQuery]);

    return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 pt-32 pb-20 transition-colors duration-300">
        <div className="container mx-auto px-4 max-w-7xl">
            <div className="bg-gray-50 dark:bg-slate-900/60 backdrop-blur-xl p-8 rounded-3xl shadow-lg dark:shadow-2xl border border-gray-200 dark:border-slate-800 mb-10">
                <h1 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white tracking-tight">
                    ค้นหาอสังหาฯ สำหรับ <span className="text-emerald-600 dark:text-emerald-400">"ซื้อ"</span>
                </h1>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400 w-6 h-6" />
                    <Input 
                        placeholder="พิมพ์ชื่อโครงการ, ย่าน, หรือจังหวัด..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 h-14 text-lg bg-white dark:bg-slate-950/50 border-gray-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-2xl focus-visible:ring-emerald-500/50"
                    />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-4 text-right font-medium">
                    พบประกาศ <span className="text-emerald-600 dark:text-emerald-400 font-bold">{filteredProperties.length}</span> รายการ
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProperties.length > 0 ? (
                    filteredProperties.map((property) => (
                        <Link href={`/listings/${property.id}`} key={property.id} className="group">
                            <Card className="overflow-hidden border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 backdrop-blur-sm shadow-md dark:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-500/30 transition-all duration-500 h-full group-hover:-translate-y-2">
                                <div className="aspect-video bg-gray-100 dark:bg-slate-800 relative overflow-hidden">
                                    <img 
                                        src={getImageUrl(property.images)}
                                        alt={property.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400?text=No+Image'; }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
                                    <span className={`absolute top-4 right-4 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg border border-white/20 ${
                                        property.status === 'SOLD' ? 'bg-rose-500/90' :
                                        property.status === 'BOOKED' ? 'bg-orange-500/90' :
                                        'bg-emerald-500/90'
                                    }`}>
                                        {property.status === 'SOLD' ? '🤝 ซื้อขายแล้ว' : 
                                         property.status === 'BOOKED' ? '📅 จองแล้ว' : 
                                         'ขาย'}
                                    </span>
                                </div>
                                <CardContent className="p-6">
                                    <h3 className="font-bold text-xl line-clamp-1 mb-3 text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                        {property.title}
                                    </h3>
                                    <div className="flex items-baseline gap-1 mb-4">
                                        <p className="text-emerald-600 dark:text-emerald-400 font-bold text-2xl tracking-tight">฿{property.price.toLocaleString()}</p>
                                    </div>
                                    <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm mb-6">
                                        <MapPin className="w-4 h-4 mr-2 flex-shrink-0 text-emerald-500" />
                                        <span className="line-clamp-1">{property.address}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-5 border-t border-gray-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 font-medium">
                                        <span className="flex items-center gap-1.5"><Bed className="w-4 h-4 text-emerald-500/70"/> {property.bedrooms} นอน</span>
                                        <span className="flex items-center gap-1.5"><Bath className="w-4 h-4 text-emerald-500/70"/> {property.bathrooms} น้ำ</span>
                                        <span className="flex items-center gap-1.5"><Ruler className="w-4 h-4 text-emerald-500/70"/> {property.size} ตร.ม.</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-900/20 rounded-3xl border-2 border-gray-200 dark:border-slate-800 border-dashed">
                        <Search className="w-12 h-12 mb-4 text-slate-300 dark:text-slate-700" />
                        <p className="text-xl font-medium text-slate-600 dark:text-slate-300">ไม่พบประกาศสำหรับขายในขณะนี้</p>
                        <p className="text-sm mt-2">ลองเปลี่ยนคำค้นหาเพื่อพบประกาศที่ใช่</p>
                    </div>
                )}
            </div>
        </div>
    </div>
);
}