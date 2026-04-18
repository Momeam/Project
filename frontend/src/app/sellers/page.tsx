'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/useAuthStore';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, User, BadgeCheck } from 'lucide-react';
// หมายเหตุ: เอา import ที่ไม่ได้ใช้ออกไปแล้วครับ (Input, MapPin, Phone)

export default function SellersPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const { usersList: users, fetchUsers } = useAuthStore();

    React.useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // ⭐️ กรองเฉพาะคนที่เป็น SELLER
    const approvedSellers = useMemo(() => {
        // 1. ป้องกันแอปพังกรณี users ยังโหลดไม่เสร็จ หรือไม่มีค่า
        if (!users || !Array.isArray(users)) return [];

        // 2. ใส่ type 'any' ให้ p เพื่อไม่ให้ TypeScript แจ้งเตือนเส้นใต้สีแดง
        return users.filter((p: any) => {
            const isSeller = p?.role === 'SELLER';
            
            const query = searchQuery.toLowerCase();
            
            // 3. ดักค่าว่างไว้ก่อน เพื่อป้องกัน error ตอนเรียกใช้ .toLowerCase()
            const safeUsername = p?.username || '';
            const safeFullName = p?.full_name || ''; // ใช้ full_name จาก backend
            const safeEmail = p?.email || '';

            const matchesSearch = 
                safeUsername.toLowerCase().includes(query) ||
                safeFullName.toLowerCase().includes(query) ||
                safeEmail.toLowerCase().includes(query);

            return isSeller && matchesSearch;
        });
    }, [users, searchQuery]);

    return (
    <div className="min-h-screen bg-background text-foreground pt-32 pb-20 transition-colors duration-300">
        {/* Header ค้นหา (Adaptive Design) */}
        <div className="container mx-auto px-4 max-w-7xl">
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
                        placeholder="ค้นหาชื่อผู้ขาย, อีเมล หรือรหัส..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-14 pl-12 pr-4 bg-background dark:bg-slate-950/50 border border-border text-foreground dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium text-lg"
                    />
                </div>
            </div>
        </div>

        {/* Grid รายชื่อผู้ขาย */}
        <div className="container mx-auto px-4 max-w-7xl">
            {approvedSellers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {approvedSellers.map((seller: any) => (
                        <Link href={`/sellers/${seller.id}`} key={seller.id} className="group">
                            <Card className="overflow-hidden border border-border bg-card dark:bg-slate-900/40 backdrop-blur-sm shadow-md dark:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-500/30 transition-all duration-500 h-full group-hover:-translate-y-2">
                                <CardContent className="p-6 flex items-center gap-5">
                                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border-2 border-emerald-500/30 group-hover:border-emerald-400 transition-colors flex-shrink-0 shadow-lg">
                                        <img 
                                            src={seller?.verificationDetails?.documentUrl || `https://ui-avatars.com/api/?name=${seller.username}&background=random`} 
                                            alt={seller.username} 
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                            <h3 className="font-bold text-xl text-foreground dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors tracking-tight">
                                                {seller?.verificationDetails?.fullName || seller.username}
                                            </h3>
                                            <BadgeCheck className="w-5 h-5 text-emerald-500 drop-shadow-sm" />
                                        </div>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-4 font-medium">
                                            <User className="w-3.5 h-3.5" /> รหัส: {seller.id}
                                        </p>
                                        <Button variant="outline" size="sm" className="rounded-xl w-full h-9 text-xs font-bold border-border bg-background dark:bg-slate-800 text-muted-foreground dark:text-slate-300 group-hover:bg-emerald-500/10 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-all">
                                            ดูโปรไฟล์และประกาศ
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 text-slate-500 bg-slate-100/50 dark:bg-slate-900/20 rounded-3xl border-2 border-border border-dashed">
                    <Search className="w-12 h-12 mb-4 text-slate-300 dark:text-slate-700" />
                    <p className="text-xl font-medium text-slate-600 dark:text-slate-400">ไม่พบรายชื่อผู้ขาย</p>
                </div>
            )}
        </div>
    </div>
);
}