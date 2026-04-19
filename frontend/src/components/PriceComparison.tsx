'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, ArrowUpRight, ArrowDownRight, Minus, MapPin, Bed, Bath, Ruler, X, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface PriceComparisonProps {
    currentProperty: any; // property ปัจจุบัน
}

function getImageUrl(images: any): string {
    try {
        let imgs = images;
        if (typeof imgs === 'string') imgs = JSON.parse(imgs);
        if (typeof imgs === 'string') imgs = JSON.parse(imgs);
        if (Array.isArray(imgs) && imgs.length > 0) {
            const raw = imgs[0]?.url || imgs[0]?.image_url || imgs[0] || '';
            const cleaned = String(raw).replace(/^["']|["']$/g, '');
            if (cleaned.startsWith('http')) return cleaned;
            if (cleaned.startsWith('/uploads')) return `/api${cleaned}`;
            if (cleaned) return `/api/uploads/${cleaned}`;
        }
    } catch {}
    return 'https://placehold.co/300x200?text=No+Image';
}

export default function PriceComparison({ currentProperty }: PriceComparisonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [allProperties, setAllProperties] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchSimilar = async () => {
        if (allProperties.length > 0) { setIsOpen(true); return; }
        setIsLoading(true);
        try {
            const res = await fetch('/api/properties');
            if (res.ok) {
                const data = await res.json();
                setAllProperties(data);
            }
        } catch (err) {
            console.error('Error fetching properties:', err);
        } finally {
            setIsLoading(false);
            setIsOpen(true);
        }
    };

    // กรองเฉพาะประเภทเดียวกัน (CONDO เทียบ CONDO, HOUSE เทียบ HOUSE)
    const similarProperties = useMemo(() => {
        if (!currentProperty || allProperties.length === 0) return [];
        return allProperties
            .filter(p =>
                p.id !== currentProperty.id &&
                p.category === currentProperty.category &&
                p.type === currentProperty.type &&
                p.status === 'ACTIVE'
            )
            .sort((a, b) => Math.abs(a.price - currentProperty.price) - Math.abs(b.price - currentProperty.price))
            .slice(0, 5); // เทียบสูงสุด 5 รายการ
    }, [allProperties, currentProperty]);

    const currentPrice = currentProperty?.price || 0;
    const currentPricePerSqm = currentProperty?.size > 0 ? currentPrice / currentProperty.size : 0;

    // คำนวณค่าเฉลี่ยราคา
    const avgPrice = similarProperties.length > 0
        ? similarProperties.reduce((sum: number, p: any) => sum + Number(p.price), 0) / similarProperties.length
        : 0;
    const avgPricePerSqm = similarProperties.length > 0
        ? similarProperties.filter((p: any) => p.size > 0).reduce((sum: number, p: any) => sum + (Number(p.price) / Number(p.size)), 0) / similarProperties.filter((p: any) => p.size > 0).length
        : 0;

    const priceDiffPercent = avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice) * 100 : 0;

    const categoryLabel: Record<string, string> = {
        'CONDO': 'คอนโด',
        'HOUSE': 'บ้านเดี่ยว',
        'TOWNHOUSE': 'ทาวน์เฮาส์',
        'LAND': 'ที่ดิน',
        'APARTMENT': 'อพาร์ทเม้นท์',
    };

    if (!isOpen) {
        return (
            <Button
                onClick={fetchSimilar}
                disabled={isLoading}
                variant="outline"
                className="w-full h-14 rounded-2xl font-bold text-sm border-2 border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950 transition-all"
            >
                <BarChart3 className="w-5 h-5 mr-2" />
                {isLoading ? 'กำลังโหลด...' : `เทียบราคากับ${categoryLabel[currentProperty?.category] || 'ประเภท'}อื่น`}
            </Button>
        );
    }

    return (
        <Card className="border-2 border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20 rounded-2xl overflow-hidden">
            <CardContent className="p-0">
                {/* Header */}
                <div className="p-4 bg-violet-100/50 dark:bg-violet-900/30 flex justify-between items-center border-b border-violet-200 dark:border-violet-800">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-violet-200 dark:bg-violet-800 rounded-lg">
                            <BarChart3 className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white">เทียบราคา{categoryLabel[currentProperty?.category] || ''}ใกล้เคียง</h3>
                            <p className="text-[10px] text-slate-400">เปรียบเทียบกับ {similarProperties.length} ประกาศที่คล้ายกัน</p>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-violet-200 dark:hover:bg-violet-800 transition-colors">
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                </div>

                {similarProperties.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-sm">
                        ไม่พบประกาศ{categoryLabel[currentProperty?.category] || ''}อื่นเพื่อเทียบราคา
                    </div>
                ) : (
                    <div className="p-4 space-y-4">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white dark:bg-slate-800 rounded-xl p-3 text-center border border-slate-100 dark:border-slate-700">
                                <p className="text-[10px] text-slate-400 font-medium mb-1">ราคาเฉลี่ยตลาด</p>
                                <p className="text-base font-black text-slate-900 dark:text-white">
                                    ฿{avgPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </p>
                            </div>
                            <div className={`bg-white dark:bg-slate-800 rounded-xl p-3 text-center border ${
                                priceDiffPercent > 5 ? 'border-red-200 dark:border-red-800' :
                                priceDiffPercent < -5 ? 'border-emerald-200 dark:border-emerald-800' :
                                'border-slate-100 dark:border-slate-700'
                            }`}>
                                <p className="text-[10px] text-slate-400 font-medium mb-1">เทียบกับตลาด</p>
                                <p className={`text-base font-black flex items-center justify-center gap-1 ${
                                    priceDiffPercent > 5 ? 'text-red-500' :
                                    priceDiffPercent < -5 ? 'text-emerald-500' :
                                    'text-slate-600 dark:text-slate-300'
                                }`}>
                                    {priceDiffPercent > 1 ? <ArrowUpRight className="w-4 h-4" /> :
                                     priceDiffPercent < -1 ? <ArrowDownRight className="w-4 h-4" /> :
                                     <Minus className="w-4 h-4" />}
                                    {priceDiffPercent > 0 ? '+' : ''}{priceDiffPercent.toFixed(1)}%
                                </p>
                                <p className="text-[9px] text-slate-400">
                                    {priceDiffPercent > 5 ? 'สูงกว่าตลาด' : priceDiffPercent < -5 ? 'ต่ำกว่าตลาด' : 'ใกล้เคียงตลาด'}
                                </p>
                            </div>
                        </div>

                        {/* Price Bar Visualization */}
                        <div className="space-y-2">
                            {/* Current Property */}
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 w-16 text-right shrink-0">ประกาศนี้</span>
                                <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-5 overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full flex items-center justify-end pr-2"
                                        style={{ width: `${Math.min(100, avgPrice > 0 ? (currentPrice / (avgPrice * 1.5)) * 100 : 50)}%` }}
                                    >
                                        <span className="text-[9px] font-bold text-white">฿{(currentPrice / 1000000).toFixed(1)}M</span>
                                    </div>
                                </div>
                            </div>
                            {/* Average */}
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 w-16 text-right shrink-0">ค่าเฉลี่ย</span>
                                <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-5 overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-500 dark:to-slate-600 rounded-full flex items-center justify-end pr-2"
                                        style={{ width: `${Math.min(100, avgPrice > 0 ? (avgPrice / (avgPrice * 1.5)) * 100 : 50)}%` }}
                                    >
                                        <span className="text-[9px] font-bold text-white">฿{(avgPrice / 1000000).toFixed(1)}M</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Similar Properties List */}
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">ประกาศที่คล้ายกัน</p>
                            {similarProperties.map((prop: any) => {
                                const diff = ((Number(prop.price) - currentPrice) / currentPrice) * 100;
                                return (
                                    <Link href={`/listings/${prop.id}`} key={prop.id}>
                                        <div className="flex items-center gap-3 p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700 transition-all cursor-pointer group">
                                            <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 shrink-0">
                                                <img
                                                    src={getImageUrl(prop.images)}
                                                    alt={prop.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                    onError={(e) => { e.currentTarget.src = 'https://placehold.co/100x100?text=No'; }}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                                    {prop.title}
                                                </p>
                                                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                                    <MapPin className="w-3 h-3" /> {prop.province || prop.address}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs font-black text-violet-600 dark:text-violet-400">
                                                        ฿{Number(prop.price).toLocaleString()}
                                                    </span>
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                                        diff > 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400' :
                                                        diff < 0 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400' :
                                                        'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                                    }`}>
                                                        {diff > 0 ? '+' : ''}{diff.toFixed(0)}%
                                                    </span>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-violet-400 transition-colors shrink-0" />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
