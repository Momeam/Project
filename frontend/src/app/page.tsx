'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { usePropertyStore } from '@/stores/usePropertyStore';
import { Card, CardContent } from "@/components/ui/card"; 
import { MapPin, Bed, Bath, Ruler, Search, Heart, Sparkles, TrendingUp } from 'lucide-react';

import { useFavoriteStore } from '@/stores/useFavoriteStore';

export default function HomePage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'ALL' | 'SALE' | 'RENT'>('ALL');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [minBed, setMinBed] = useState(0);

    const { properties, fetchProperties, isLoading } = usePropertyStore();
    const { favoriteIds, toggleFavorite } = useFavoriteStore();

    useEffect(() => {
        fetchProperties(); 
    }, [fetchProperties]);

    const filteredProperties = useMemo(() => {
        if (!properties || properties.length === 0) return []; 

        const result = properties.filter((p) => {
            const isVisible = ['ACTIVE', 'SOLD', 'BOOKED'].includes(p.status);
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

            return isVisible && isTypeMatch && matchesSearch && isPriceMatch && isBedMatch;
        });

        return result.sort((a, b) => (favoriteIds.has(b.id) ? 1 : 0) - (favoriteIds.has(a.id) ? 1 : 0));
    }, [properties, searchQuery, filterType, minPrice, maxPrice, minBed, favoriteIds]);


    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 selection:bg-emerald-500/30 font-sans transition-colors duration-300">
            {/* 🌟 Premium Hero Section 🌟 */}
            <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
                {/* Background Video/Image & Overlay */}
                <div className="absolute inset-0 z-0">
                    <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop" className="w-full h-full object-cover scale-105 animate-pulse-slow" alt="Background" style={{ animationDuration: '20s' }} />
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-transparent"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent"></div>
                </div>
                
                <div className="container mx-auto px-4 w-full relative z-10 text-center pb-20 pt-32">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium mb-8 shadow-2xl animate-fade-in-up">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span>ค้นพบที่อยู่อาศัยระดับพรีเมียม</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-6 tracking-tight leading-tight drop-shadow-2xl animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        วิสัยทัศน์<br/>แห่งการอยู่อาศัย
                    </h1>
                    <p className="text-lg md:text-xl text-slate-300 mb-12 max-w-2xl mx-auto font-light leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        ยกระดับชีวิตของคุณด้วยแพลตฟอร์มอสังหาริมทรัพย์ที่รวบรวม<br className="hidden md:block"/>บ้าน คอนโด และที่ดินที่ดีที่สุดไว้ในที่เดียว
                    </p>
                    
                    {/* Glassmorphism Search Configurator */}
                    <div className="bg-white/10 dark:bg-slate-900/40 backdrop-blur-2xl p-3 md:p-4 rounded-[2rem] shadow-2xl shadow-black/50 border border-white/20 max-w-5xl mx-auto space-y-3 flex flex-col animate-fade-in-up transform transition-all duration-500 hover:scale-[1.01]" style={{ animationDelay: '0.3s' }}>
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="flex bg-slate-900/50 p-1.5 rounded-[1.5rem] shrink-0 border border-white/10">
                                {[{ id: 'ALL', label: 'ทั้งหมด' }, { id: 'SALE', label: 'ซื้อ' }, { id: 'RENT', label: 'เช่า' }].map((type) => (
                                    <button 
                                        key={type.id} 
                                        onClick={() => setFilterType(type.id as any)} 
                                        className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${filterType === type.id ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                            <div className="relative flex-1 group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-emerald-500 transition-colors" />
                                <input placeholder="ค้นหาทำเล, ชื่อโครงการ, รถไฟฟ้า..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-full min-h-[58px] pl-14 pr-6 rounded-[1.5rem] bg-slate-900/40 focus:bg-white/90 border border-white/10 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none text-white focus:text-slate-900 placeholder:text-slate-400 transition-all duration-300 text-base" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">฿</span>
                                <input type="number" placeholder="ราคาต่ำสุด" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-full h-[54px] pl-9 pr-4 rounded-[1.2rem] bg-slate-900/40 border border-white/10 focus:bg-white/90 focus:border-emerald-500/50 text-white focus:text-slate-900 placeholder:text-slate-400 text-sm outline-none transition-all focus:ring-4 focus:ring-emerald-500/10" />
                            </div>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">฿</span>
                                <input type="number" placeholder="ราคาสูงสุด" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full h-[54px] pl-9 pr-4 rounded-[1.2rem] bg-slate-900/40 border border-white/10 focus:bg-white/90 focus:border-emerald-500/50 text-white focus:text-slate-900 placeholder:text-slate-400 text-sm outline-none transition-all focus:ring-4 focus:ring-emerald-500/10" />
                            </div>
                            <select value={minBed} onChange={(e) => setMinBed(parseInt(e.target.value))} className="h-[54px] px-4 rounded-[1.2rem] bg-slate-900/40 border border-white/10 focus:bg-white/90 focus:border-emerald-500/50 text-slate-300 focus:text-slate-900 text-sm cursor-pointer outline-none transition-all focus:ring-4 focus:ring-emerald-500/10">
                                <option value="0" className="text-slate-900">ห้องนอน (ทั้งหมด)</option>
                                <option value="1" className="text-slate-900">1 ห้องนอน ขึ้นไป</option>
                                <option value="2" className="text-slate-900">2 ห้องนอน ขึ้นไป</option>
                                <option value="3" className="text-slate-900">3 ห้องนอน ขึ้นไป</option>
                                <option value="4" className="text-slate-900">4 ห้องนอน ขึ้นไป</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🌟 Content Section 🌟 */}
            <div className="container mx-auto px-4 py-20 max-w-[1400px]">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold mb-2">
                            <TrendingUp className="w-5 h-5" />
                            <span className="tracking-wider uppercase text-sm">Exclusive Listings</span>
                        </div>
                        <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            ประกาศล่าสุดที่คัดสรรมาเพื่อคุณ
                        </h2>
                    </div>
                    <span className="text-sm font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 px-4 py-2 rounded-full shadow-inner border border-slate-200 dark:border-slate-700">
                        พบ {filteredProperties.length} รายการ
                    </span>
                </div>
                
                {isLoading && properties.length === 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-[450px] rounded-[2rem] bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-700">
                                <div className="aspect-[4/3] bg-slate-200 dark:bg-slate-700 rounded-t-[2rem]"></div>
                                <div className="p-6 space-y-4">
                                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                                    <div className="flex gap-2 pt-4">
                                        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg flex-1"></div>
                                        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg flex-1"></div>
                                        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg flex-1"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {filteredProperties.length > 0 ? (
                            filteredProperties.map((property) => (
                                <Link href={`/listings/${property.id}`} key={property.id} className="group block h-full outline-none">
                                    <div className="h-full overflow-hidden border border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-2 transition-all duration-500 rounded-[2rem] group-focus-visible:ring-4 ring-emerald-500/50 flex flex-col relative">
                                        
                                        <button 
                                            onClick={(e) => {
                                                e.preventDefault(); 
                                                toggleFavorite(property.id);
                                            }}
                                            className="absolute top-4 right-4 z-20 bg-white/20 dark:bg-black/20 backdrop-blur-md border border-white/30 p-2.5 rounded-full shadow-lg hover:bg-white/40 dark:hover:bg-black/40 hover:scale-110 transition-all duration-300"
                                        >
                                            <Heart className={`w-5 h-5 transition-colors ${favoriteIds.has(property.id) ? "fill-rose-500 text-rose-500" : "text-white"}`} />
                                        </button>

                                        <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                                            <img src={property.images?.[0]?.url || 'https://images.unsplash.com/photo-1545083036-74fcce58bdfe?q=80&w=2070&auto=format&fit=crop'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" alt={property.title} />
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>
                                            
                                            <div className="absolute top-4 left-4">
                                                <span className={`px-4 py-1.5 rounded-full text-xs font-black tracking-wider text-white shadow-xl border border-white/20 backdrop-blur-sm ${
                                                    property.status === 'SOLD' ? 'bg-rose-500/90' :
                                                    property.status === 'BOOKED' ? 'bg-orange-500/90' :
                                                    property.type === 'SALE' ? 'bg-emerald-500/90' : 'bg-cyan-500/90'
                                                }`}>
                                                    {property.status === 'SOLD' ? '🤝 ซื้อขายแล้ว' : 
                                                     property.status === 'BOOKED' ? '📅 จองแล้ว' : 
                                                     property.type === 'SALE' ? 'ขาย' : 'เช่า'}
                                                </span>
                                            </div>
                                            
                                            <div className="absolute bottom-5 left-5 right-5">
                                                <p className="text-white font-black text-3xl drop-shadow-md flex items-end gap-1">
                                                    ฿{property.price.toLocaleString()} 
                                                    {property.type === 'RENT' && <span className="text-sm font-medium opacity-80 mb-1">/เดือน</span>}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="p-6 relative flex-1 flex flex-col">
                                            <div className="absolute -top-6 right-6 w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 flex items-center justify-center transform rotate-3 group-hover:rotate-6 transition-transform">
                                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{property.category}</span>
                                            </div>

                                            <div className="mb-4 pr-10">
                                                <h3 className="text-xl font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-tight">{property.title}</h3>
                                            </div>
                                            
                                            <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm mb-6 mt-auto">
                                                <MapPin className="w-4 h-4 mr-2 flex-shrink-0 text-emerald-500" />
                                                <span className="line-clamp-1">{property.address}</span>
                                            </div>
                                            
                                            <div className="flex items-center justify-between pt-5 border-t border-slate-100 dark:border-slate-800/50 text-sm text-slate-600 dark:text-slate-300">
                                                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700/50 flex-1 justify-center mx-1">
                                                    <Bed className="w-4 h-4 text-emerald-500"/> <b className="text-slate-900 dark:text-white">{property.bedrooms}</b>
                                                </div>
                                                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700/50 flex-1 justify-center mx-1">
                                                    <Bath className="w-4 h-4 text-cyan-500"/> <b className="text-slate-900 dark:text-white">{property.bathrooms}</b>
                                                </div>
                                                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700/50 flex-1 justify-center mx-1">
                                                    <Ruler className="w-4 h-4 text-purple-500"/> <b className="text-slate-900 dark:text-white">{property.size}</b> ม²
                                                </div>
                                            </div>

                                            {/* Render interiorDetails seamlessly if it exists */}
                                            {property.interiorDetails && (
                                                <div className="mt-4 pt-4 border-t border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 mr-2"><Sparkles className="w-3 h-3 inline pb-0.5"/> จุดเด่น:</span> 
                                                    <span className="line-clamp-1 italic">{property.interiorDetails}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="col-span-full py-32 text-center rounded-3xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800">
                                <div className="inline-flex p-6 rounded-full bg-slate-100 dark:bg-slate-800 mb-6 shadow-inner">
                                    <Search className="w-12 h-12 text-slate-400" />
                                </div>
                                <h3 className="text-slate-900 dark:text-white font-bold text-2xl mb-2">ไม่พบรายการที่คุณกำลังค้นหา</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-lg">ลองปรับเปลี่ยนทำเล ราคา หรือค้นหาด้วยคีย์เวิร์ดอื่น</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}