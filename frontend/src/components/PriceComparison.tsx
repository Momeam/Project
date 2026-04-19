'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, MapPin, Bed, Bath, Ruler, X, ExternalLink, ArrowUpRight, ArrowDownRight, Minus, Check } from 'lucide-react';
import Link from 'next/link';

interface PriceComparisonProps {
    currentProperty: any;
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
            if (cleaned.startsWith('/uploads')) return `http://localhost:5000${cleaned}`;
            if (cleaned) return `http://localhost:5000/uploads/${cleaned}`;
        }
    } catch {}
    return 'https://placehold.co/300x200?text=No+Image';
}

const categoryLabel: Record<string, string> = {
    'CONDO': 'คอนโด', 'HOUSE': 'บ้านเดี่ยว', 'TOWNHOUSE': 'ทาวน์เฮาส์',
    'LAND': 'ที่ดิน', 'APARTMENT': 'อพาร์ทเม้นท์',
};

// ฟังก์ชันแสดง badge เปรียบเทียบ
function DiffBadge({ current, other, unit = '', reverse = false }: { current: number; other: number; unit?: string; reverse?: boolean }) {
    if (!current || !other) return <span className="text-slate-400 text-[10px]">—</span>;
    const diff = ((other - current) / current) * 100;
    const isGood = reverse ? diff > 0 : diff < 0;
    const isBad = reverse ? diff < 0 : diff > 0;

    return (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 ${
            isGood ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400' :
            isBad ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400' :
            'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
        }`}>
            {diff > 1 ? <ArrowUpRight className="w-3 h-3" /> :
             diff < -1 ? <ArrowDownRight className="w-3 h-3" /> :
             <Minus className="w-3 h-3" />}
            {diff > 0 ? '+' : ''}{diff.toFixed(0)}%
        </span>
    );
}

// แถวเปรียบเทียบ
function CompareRow({ label, icon: Icon, currentVal, otherVal, currentDisplay, otherDisplay, unit = '', higherIsBetter = false }: {
    label: string; icon: any; currentVal: number; otherVal: number;
    currentDisplay: string; otherDisplay: string; unit?: string; higherIsBetter?: boolean;
}) {
    const currentWins = higherIsBetter ? currentVal >= otherVal : currentVal <= otherVal;
    const otherWins = higherIsBetter ? otherVal >= currentVal : otherVal <= currentVal;

    return (
        <div className="grid grid-cols-[1fr_100px_1fr] items-center py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
            {/* Current */}
            <div className="text-right pr-3">
                <span className={`text-sm font-bold ${currentWins && currentVal !== otherVal ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                    {currentDisplay}{unit}
                </span>
                {currentWins && currentVal !== otherVal && <Check className="w-3 h-3 text-emerald-500 inline ml-1" />}
            </div>
            {/* Label */}
            <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-slate-400">
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                </div>
            </div>
            {/* Other */}
            <div className="text-left pl-3">
                <span className={`text-sm font-bold ${otherWins && currentVal !== otherVal ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                    {otherDisplay}{unit}
                </span>
                {otherWins && currentVal !== otherVal && <Check className="w-3 h-3 text-emerald-500 inline ml-1" />}
            </div>
        </div>
    );
}

export default function PriceComparison({ currentProperty }: PriceComparisonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [allProperties, setAllProperties] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);

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

    const similarProperties = useMemo(() => {
        if (!currentProperty || allProperties.length === 0) return [];
        return allProperties
            .filter(p =>
                p.id !== currentProperty.id &&
                p.category === currentProperty.category &&
                p.type === currentProperty.type &&
                p.status === 'ACTIVE'
            )
            .sort((a: any, b: any) => Math.abs(a.price - currentProperty.price) - Math.abs(b.price - currentProperty.price))
            .slice(0, 8);
    }, [allProperties, currentProperty]);

    const selectedProperty = similarProperties.find((p: any) => p.id === selectedId);

    if (!isOpen) {
        return (
            <Button
                onClick={fetchSimilar}
                disabled={isLoading}
                variant="outline"
                className="w-full h-14 rounded-2xl font-bold text-sm border-2 border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950 transition-all"
            >
                <BarChart3 className="w-5 h-5 mr-2" />
                {isLoading ? 'กำลังโหลด...' : `เปรียบเทียบกับ${categoryLabel[currentProperty?.category] || 'ประกาศ'}อื่น`}
            </Button>
        );
    }

    const curPrice = Number(currentProperty?.price || 0);
    const curSize = Number(currentProperty?.size || 0);
    const curBed = Number(currentProperty?.bedrooms || 0);
    const curBath = Number(currentProperty?.bathrooms || 0);
    const curPpsm = curSize > 0 ? curPrice / curSize : 0;

    return (
        <Card className="border-2 border-violet-200 dark:border-violet-800 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
            <CardContent className="p-0">
                {/* Header */}
                <div className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40 flex justify-between items-center border-b border-violet-200 dark:border-violet-800">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-violet-200 dark:bg-violet-800 rounded-xl">
                            <BarChart3 className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white">เปรียบเทียบ{categoryLabel[currentProperty?.category] || 'ประกาศ'}</h3>
                            <p className="text-[10px] text-slate-400">เลือกประกาศเพื่อเปรียบเทียบรายละเอียด</p>
                        </div>
                    </div>
                    <button onClick={() => { setIsOpen(false); setSelectedId(null); }} className="p-1.5 rounded-lg hover:bg-violet-200 dark:hover:bg-violet-800 transition-colors">
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                </div>

                {similarProperties.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">
                        ไม่พบประกาศ{categoryLabel[currentProperty?.category] || ''}อื่นเพื่อเปรียบเทียบ
                    </div>
                ) : (
                    <div className="p-4 space-y-4">
                        {/* Property Selector - Horizontal Scroll */}
                        <div>
                            <p className="text-xs font-bold text-slate-500 mb-2">เลือกประกาศที่ต้องการเทียบ:</p>
                            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                                {similarProperties.map((prop: any) => {
                                    const isSelected = selectedId === prop.id;
                                    return (
                                        <button
                                            key={prop.id}
                                            onClick={() => setSelectedId(prop.id)}
                                            className={`shrink-0 w-28 rounded-xl border-2 overflow-hidden transition-all duration-200 ${
                                                isSelected
                                                    ? 'border-violet-500 ring-2 ring-violet-200 dark:ring-violet-800 scale-105 shadow-lg'
                                                    : 'border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700'
                                            }`}
                                        >
                                            <div className="h-16 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                                <img
                                                    src={getImageUrl(prop.images)}
                                                    alt={prop.title}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { e.currentTarget.src = 'https://placehold.co/112x64?text=No'; }}
                                                />
                                            </div>
                                            <div className="p-1.5">
                                                <p className="text-[9px] font-bold text-slate-700 dark:text-slate-300 truncate">{prop.title}</p>
                                                <p className="text-[10px] font-black text-violet-600 dark:text-violet-400">
                                                    ฿{Number(prop.price).toLocaleString()}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Comparison Table */}
                        {selectedProperty ? (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {/* Column Headers */}
                                <div className="grid grid-cols-[1fr_100px_1fr] items-end pb-3 mb-1 border-b-2 border-violet-200 dark:border-violet-700">
                                    <div className="text-right pr-3">
                                        <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/50 px-2 py-0.5 rounded-full">ประกาศนี้</span>
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate mt-1">{currentProperty.title}</p>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-[10px] font-bold text-slate-400">VS</span>
                                    </div>
                                    <div className="text-left pl-3">
                                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">เทียบกับ</span>
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate mt-1">{selectedProperty.title}</p>
                                    </div>
                                </div>

                                {/* Comparison Rows */}
                                <div>
                                    <CompareRow
                                        label="ราคา"
                                        icon={BarChart3}
                                        currentVal={curPrice}
                                        otherVal={Number(selectedProperty.price)}
                                        currentDisplay={`฿${curPrice.toLocaleString()}`}
                                        otherDisplay={`฿${Number(selectedProperty.price).toLocaleString()}`}
                                        higherIsBetter={false}
                                    />
                                    <CompareRow
                                        label="ขนาด"
                                        icon={Ruler}
                                        currentVal={curSize}
                                        otherVal={Number(selectedProperty.size || 0)}
                                        currentDisplay={`${curSize}`}
                                        otherDisplay={`${selectedProperty.size || '-'}`}
                                        unit=" ตร.ม."
                                        higherIsBetter={true}
                                    />
                                    <CompareRow
                                        label="ราคา/ตร.ม."
                                        icon={Ruler}
                                        currentVal={curPpsm}
                                        otherVal={selectedProperty.size > 0 ? Number(selectedProperty.price) / Number(selectedProperty.size) : 0}
                                        currentDisplay={curPpsm > 0 ? `฿${curPpsm.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '-'}
                                        otherDisplay={selectedProperty.size > 0 ? `฿${(Number(selectedProperty.price) / Number(selectedProperty.size)).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '-'}
                                        higherIsBetter={false}
                                    />
                                    <CompareRow
                                        label="ห้องนอน"
                                        icon={Bed}
                                        currentVal={curBed}
                                        otherVal={Number(selectedProperty.bedrooms || 0)}
                                        currentDisplay={`${curBed}`}
                                        otherDisplay={`${selectedProperty.bedrooms || '-'}`}
                                        unit=" ห้อง"
                                        higherIsBetter={true}
                                    />
                                    <CompareRow
                                        label="ห้องน้ำ"
                                        icon={Bath}
                                        currentVal={curBath}
                                        otherVal={Number(selectedProperty.bathrooms || 0)}
                                        currentDisplay={`${curBath}`}
                                        otherDisplay={`${selectedProperty.bathrooms || '-'}`}
                                        unit=" ห้อง"
                                        higherIsBetter={true}
                                    />
                                    <CompareRow
                                        label="ที่ตั้ง"
                                        icon={MapPin}
                                        currentVal={0}
                                        otherVal={0}
                                        currentDisplay={currentProperty.province || '-'}
                                        otherDisplay={selectedProperty.province || '-'}
                                    />
                                </div>

                                {/* Link to other property */}
                                <Link href={`/listings/${selectedProperty.id}`} target="_blank">
                                    <Button variant="outline" className="w-full mt-3 h-10 rounded-xl text-xs font-bold text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950">
                                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> ดูรายละเอียดประกาศที่เทียบ
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="text-center py-6 text-slate-400">
                                <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p className="text-sm font-medium">เลือกประกาศด้านบนเพื่อเปรียบเทียบ</p>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
