'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { usePropertyStore } from '@/stores/usePropertyStore';
import { Card, CardContent } from "@/components/ui/card"; 
import { MapPin, Bed, Bath, Ruler, Search, Heart, Loader2 } from 'lucide-react';
import AdBanner from '@/components/AdBanner';

export default function HomePage() {
    // ⭐️ 1. เพิ่ม State ป้องกันเว็บพัง (Hydration Crash)
    const [isMounted, setIsMounted] = useState(false);

    // --- State สำหรับตัวกรองต่างๆ ---
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'ALL' | 'SALE' | 'RENT'>('ALL');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [minBed, setMinBed] = useState(0);

    // --- ดึงข้อมูลและ Action จาก Store ---
    const { properties, fetchProperties, isLoading, toggleFavorite } = usePropertyStore();

    // --- 2. เซ็ตค่าเมื่อเว็บโหลดเสร็จ และดึงข้อมูล ---
    useEffect(() => {
        setIsMounted(true);
        fetchProperties(); 
    }, [fetchProperties]);

    // --- ตรรกะการคัดกรองข้อมูล (Filter Logic) ---
    const filteredProperties = useMemo(() => {
        if (!properties || properties.length === 0) return []; 

        const result = properties.filter((p) => {
            const isActive = p.status === 'ACTIVE';
            const isTypeMatch = filterType === 'ALL' || p.type === filterType;
            const query = searchQuery.toLowerCase();
            const matchesSearch = 
                (p.title?.toLowerCase() || '').includes(query) || 
                (p.address?.toLowerCase() || '').includes(query) ||
                (p.province?.toLowerCase() || '').includes(query);
            
            const price = p.price || 0;
            const min = minPrice ? parseInt(minPrice) : 0;
            const max = maxPrice ? parseInt(maxPrice) : Infinity;
            const isPriceMatch = price >= min && price <= max;

            const isBedMatch = minBed === 0 || p.bedrooms >= minBed;

            return isActive && isTypeMatch && matchesSearch && isPriceMatch && isBedMatch;
        });

        return result.sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));
    }, [properties, searchQuery, filterType, minPrice, maxPrice, minBed]);

    // ⭐️ 3. ถ้า JS ยังไม่ทำงาน ให้แสดงหน้าโหลด ป้องกัน UI เละ
    if (!isMounted) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                <p className="text-white font-medium text-lg">กำลังโหลดข้อมูล HomeLink...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* โซน Hero & Search Box */}
            <div className="relative bg-slate-900 py-24 lg:py-32 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover opacity-40" alt="Background" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
                </div>
                
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight leading-tight">ค้นหาบ้านที่ใช่</h1>
                    <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto font-light">Platform อสังหาริมทรัพย์ที่คุณไว้วางใจได้ อันดับ 1</p>
                    
                    <div className="bg-white p-4 rounded-2xl shadow-2xl max-w-5xl mx-auto space-y-4 text-left">
                        <div className="flex flex-col md:flex-row gap-2">
                            <div className="flex bg-gray-100 p-1 rounded-xl shrink-0">
                                {[{ id: 'ALL', label: 'ทั้งหมด' }, { id: 'SALE', label: 'ซื้อ' }, { id: 'RENT', label: 'เช่า' }].map((type) => (
                                    <button key={type.id} onClick={() => setFilterType(type.id as any)} className={`px-6 py-3 rounded-lg text-sm font-bold transition-all ${filterType === type.id ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{type.label}</button>
                                ))}
                            </div>
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input placeholder="ค้นหาทำเล, ชื่อโครงการ..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-full min-h-[50px] pl-12 pr-4 rounded-xl bg-gray-50 focus:bg-white border border-transparent focus:border-slate-200 focus:outline-none text-slate-900" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <input type="number" placeholder="ราคาต่ำสุด (บาท)" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="h-[50px] px-4 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-slate-200 text-sm outline-none" />
                            <input type="number" placeholder="ราคาสูงสุด (บาท)" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="h-[50px] px-4 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-slate-200 text-sm outline-none" />
                            <select value={minBed} onChange={(e) => setMinBed(parseInt(e.target.value))} className="h-[50px] px-4 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-slate-200 text-sm cursor-pointer outline-none text-gray-700">
                                <option value="0">ห้องนอน (ทั้งหมด)</option>
                                <option value="1">1 ห้องนอน ขึ้นไป</option>
                                <option value="2">2 ห้องนอน ขึ้นไป</option>
                                <option value="3">3 ห้องนอน ขึ้นไป</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <AdBanner position="TOP_BANNER" />

            <div className="container mx-auto px-4 py-12 max-w-7xl">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        ประกาศล่าสุด 
                        <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">({filteredProperties.length})</span>
                    </h2>
                </div>
                
                {isLoading && properties.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 animate-pulse text-xl">
                        กำลังดึงข้อมูลจากเซิร์ฟเวอร์...
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredProperties.length > 0 ? (
                            filteredProperties.map((property) => (
                                <Link href={`/listings/${property.id}`} key={property.id} className="group block h-full relative">
                                    <Card className="h-full overflow-hidden border-0 bg-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-xl">
                                        
                                        <button 
                                            onClick={(e) => {
                                                e.preventDefault(); 
                                                toggleFavorite(property.id);
                                            }}
                                            className="absolute top-3 right-3 z-20 bg-white/90 p-1.5 rounded-full shadow-sm hover:scale-110 transition-transform"
                                        >
                                            <Heart className={`w-4 h-4 ${property.isFavorite ? "fill-rose-500 text-rose-500" : "text-gray-400"}`} />
                                        </button>

                                        <div className="aspect-[4/3] bg-gray-200 relative overflow-hidden">
                                            <img src={property.images?.[0]?.url || 'https://placehold.co/600x400?text=No+Image'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={property.title} />
                                            <div className="absolute top-3 left-3">
                                                <span className={`px-3 py-1 rounded-md text-xs font-bold text-white shadow-sm ${property.type === 'SALE' ? 'bg-emerald-600' : 'bg-blue-600'}`}>
                                                    {property.type === 'SALE' ? 'ขาย' : 'เช่า'}
                                                </span>
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                                                <p className="text-white font-bold text-lg">
                                                    ฿{property.price.toLocaleString()} {property.type === 'RENT' && <span className="text-xs font-normal">/เดือน</span>}
                                                </p>
                                            </div>
                                        </div>

                                        <CardContent className="p-5">
                                            <div className="mb-3">
                                                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">{property.category}</p>
                                                <h3 className="text-base font-bold text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors">{property.title}</h3>
                                            </div>
                                            <div className="flex items-center text-gray-500 text-sm mb-4">
                                                <MapPin className="w-4 h-4 mr-1.5 flex-shrink-0" />
                                                <span className="line-clamp-1">{property.address}</span>
                                            </div>
                                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-sm text-gray-600">
                                                <span className="flex items-center gap-1"><Bed className="w-4 h-4 text-gray-400"/> <b>{property.bedrooms}</b> นอน</span>
                                                <span className="flex items-center gap-1"><Bath className="w-4 h-4 text-gray-400"/> <b>{property.bathrooms}</b> น้ำ</span>
                                                <span className="flex items-center gap-1"><Ruler className="w-4 h-4 text-gray-400"/> <b>{property.size}</b> ม²</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))
                        ) : (
                            <div className="col-span-full py-20 text-center">
                                <div className="inline-block p-6 rounded-full bg-white mb-4 shadow-sm">
                                    <Search className="w-10 h-10 text-gray-300" />
                                </div>
                                <p className="text-gray-900 font-medium text-lg">ไม่พบรายการที่ค้นหา</p>
                                <p className="text-gray-500">ลองปรับเปลี่ยนเงื่อนไขราคา หรือประเภทดูนะครับ</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}