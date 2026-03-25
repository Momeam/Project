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
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 py-12 px-4">
                <div className="container mx-auto max-w-5xl text-center space-y-6">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
                        ค้นหาตัวแทน / ผู้ขาย
                    </h1>
                    <p className="text-slate-500">
                        รวบรวมผู้ขายคุณภาพที่ผ่านการยืนยันตัวตนแล้ว
                    </p>
                    
                    <div className="max-w-xl mx-auto relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                            placeholder="ค้นหาชื่อผู้ขาย..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-12 pl-12 pr-4 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Grid รายชื่อผู้ขาย */}
            <div className="container mx-auto px-4 py-12 max-w-7xl">
                {approvedSellers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {approvedSellers.map((seller: any) => (
                            <Link href={`/sellers/${seller.id}`} key={seller.id} className="group">
                                <Card className="overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 h-full hover:-translate-y-1">
                                    <CardContent className="p-6 flex items-center gap-4">
                                        <div className="w-20 h-20 bg-gray-100 rounded-full overflow-hidden border-2 border-emerald-100 flex-shrink-0">
                                            <img 
                                                src={seller?.verificationDetails?.documentUrl || `https://ui-avatars.com/api/?name=${seller.username}&background=random`} 
                                                alt={seller.username} 
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1 mb-1">
                                                <h3 className="font-bold text-lg text-slate-900 truncate group-hover:text-emerald-600 transition-colors">
                                                    {seller?.verificationDetails?.fullName || seller.username}
                                                </h3>
                                                <BadgeCheck className="w-4 h-4 text-emerald-500" />
                                            </div>
                                            <p className="text-sm text-slate-500 flex items-center gap-1 mb-2">
                                                <User className="w-3 h-3" /> รหัส: {seller.id}
                                            </p>
                                            <Button variant="outline" size="sm" className="rounded-full w-full h-8 text-xs">
                                                ดูโปรไฟล์และประกาศ
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 text-slate-400">
                        ไม่พบรายชื่อผู้ขาย
                    </div>
                )}
            </div>
        </div>
    );
}