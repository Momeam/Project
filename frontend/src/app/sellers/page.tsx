'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, User, BadgeCheck, Building2, Home, Briefcase, Loader2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

// 🏷️ แปลง seller_type เป็นข้อความไทย + ไอคอน
const SELLER_TYPE_MAP: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
    DEVELOPER: { label: 'เจ้าของอสังหา', icon: Building2, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800' },
    OWNER: { label: 'เจ้าของบ้าน', icon: Home, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800' },
    AGENT: { label: 'นายหน้า', icon: Briefcase, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800' },
};

export default function SellersPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [sellers, setSellers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // 🟢 ดึงข้อมูลผู้ขายจาก API สาธารณะ (ไม่ต้อง login)
    useEffect(() => {
        const fetchSellers = async () => {
            try {
                const res = await fetch('/api/users/sellers');
                if (res.ok) {
                    const data = await res.json();
                    setSellers(data);
                }
            } catch (error) {
                console.error('Error fetching sellers:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSellers();
    }, []);

    // ⭐️ กรองคำค้นหา
    const filteredSellers = useMemo(() => {
        if (!searchQuery.trim()) return sellers;
        const query = searchQuery.toLowerCase();
        return sellers.filter((s: any) => {
            const name = (s.full_name || s.username || '').toLowerCase();
            const email = (s.email || '').toLowerCase();
            const type = SELLER_TYPE_MAP[s.seller_type]?.label || '';
            return name.includes(query) || email.includes(query) || type.includes(query);
        });
    }, [sellers, searchQuery]);

    return (
    <div className="min-h-screen bg-background text-foreground pt-32 pb-20 transition-colors duration-300">
        {/* Header ค้นหา */}
        <div className="container mx-auto px-4 max-w-7xl">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 mb-4 font-medium transition-colors">
                <ArrowLeft className="w-4 h-4" /> ย้อนกลับ
            </button>
            <div className="bg-card/60 dark:bg-slate-900/60 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-border mb-10 text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground dark:text-white tracking-tight mb-4">
                    ค้นหาตัวแทน / ผู้ขาย
                </h1>
                <p className="text-muted-foreground mb-8 font-medium">
                    รวบรวมผู้ขายคุณภาพที่ผ่านการยืนยันตัวตนแล้วระดับ <span className="text-emerald-600 dark:text-emerald-400">พรีเมียม</span>
                </p>
                
                <div className="max-w-2xl mx-auto relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6" />
                    <input 
                        placeholder="ค้นหาชื่อผู้ขาย, ฐานะ หรืออีเมล..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-14 pl-12 pr-4 bg-background dark:bg-slate-950/50 border border-border text-foreground dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium text-lg"
                    />
                </div>

                {/* ⭐️ ตัวกรองตามฐานะ */}
                <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">
                    {Object.entries(SELLER_TYPE_MAP).map(([key, { label, icon: Icon, color }]) => (
                        <button
                            key={key}
                            onClick={() => setSearchQuery(label)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full border border-border hover:border-emerald-300 dark:hover:border-emerald-700 bg-background dark:bg-slate-800 text-sm font-semibold ${color} transition-all hover:scale-105`}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </button>
                    ))}
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="text-xs text-slate-500 hover:text-red-500 font-medium underline underline-offset-2"
                        >
                            ล้างตัวกรอง
                        </button>
                    )}
                </div>
            </div>
        </div>

        {/* Grid รายชื่อผู้ขาย */}
        <div className="container mx-auto px-4 max-w-7xl">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24">
                    <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
                    <p className="text-slate-500">กำลังดึงข้อมูลผู้ขาย...</p>
                </div>
            ) : filteredSellers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredSellers.map((seller: any) => {
                        const typeInfo = SELLER_TYPE_MAP[seller.seller_type] || SELLER_TYPE_MAP.OWNER;
                        const TypeIcon = typeInfo.icon;
                        
                        return (
                            <Link href={`/sellers/${seller.id}`} key={seller.id} className="group">
                                <Card className="overflow-hidden border border-border bg-card dark:bg-slate-900/40 backdrop-blur-sm shadow-md dark:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-500/30 transition-all duration-500 h-full group-hover:-translate-y-2">
                                    <CardContent className="p-6 flex items-center gap-5">
                                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border-2 border-emerald-500/30 group-hover:border-emerald-400 transition-colors flex-shrink-0 shadow-lg">
                                            <img 
                                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(seller.full_name || seller.username)}&background=random&bold=true`} 
                                                alt={seller.full_name || seller.username} 
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 mb-1.5">
                                                <h3 className="font-bold text-xl text-foreground dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors tracking-tight">
                                                    {seller.full_name || seller.username}
                                                </h3>
                                                <BadgeCheck className="w-5 h-5 text-emerald-500 drop-shadow-sm flex-shrink-0" />
                                            </div>
                                            {/* ⭐️ แสดงฐานะผู้ขาย */}
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${typeInfo.bg} ${typeInfo.color} mb-3`}>
                                                <TypeIcon className="w-3.5 h-3.5" />
                                                {typeInfo.label}
                                            </div>
                                            <Button variant="outline" size="sm" className="rounded-xl w-full h-9 text-xs font-bold border-border bg-background dark:bg-slate-800 text-muted-foreground dark:text-slate-300 group-hover:bg-emerald-500/10 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-all">
                                                ดูโปรไฟล์และประกาศ
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 text-slate-500 bg-slate-100/50 dark:bg-slate-900/20 rounded-3xl border-2 border-border border-dashed">
                    <Search className="w-12 h-12 mb-4 text-slate-300 dark:text-slate-700" />
                    <p className="text-xl font-medium text-slate-600 dark:text-slate-400">ไม่พบรายชื่อผู้ขาย</p>
                    <p className="text-sm text-slate-400 mt-2">ลองค้นหาด้วยคำอื่น หรือล้างตัวกรอง</p>
                </div>
            )}
        </div>
    </div>
);
}