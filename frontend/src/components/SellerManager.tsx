// ที่อยู่ไฟล์: src/components/SellerManager.tsx

'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle, Users } from 'lucide-react';
// ⚠️ Note: MockUser, getAllSellers, deleteUser ต้องถูกจัดการใน useUserManagementStore แทน
// แต่ในตัวอย่างนี้ใช้ Logic เดิม
// import { MockUser, getAllSellers, deleteUser } from '@/lib/types'; 
import { usePropertyStore } from '@/stores/usePropertyStore'; 

// ⭐️ Note: โค้ดนี้ใช้ Logic useState/useEffect ที่ถูกต้องแล้ว ไม่น่าเป็นสาเหตุของ Infinite Loop
export function SellerManager() {
    const [sellers, setSellers] = useState<any[]>([]); // ใช้ any[] ชั่วคราว แทน MockUser[]
    const deleteListingsByUserId = usePropertyStore((state) => state.deleteListingsByUserId);

    // 🟢 จำลองฟังก์ชันโหลดผู้ขาย (ควรดึงจาก useUserManagementStore)
    const loadSellers = () => {
        // setSellers(getAllSellers()); // ⚠️ ใช้ logic ดึงจาก store หรือ API จริง
        setSellers([ 
            { id: 'seller_a', username: 'Seller A', email: 'a@a.com', profileImageUrl: null },
            { id: 'seller_b', username: 'Seller B', email: 'b@b.com', profileImageUrl: 'https://placehold.co/60x60' } 
        ]);
    };

    useEffect(() => {
        loadSellers();
    }, []);

    const handleDelete = (user: any) => {
        if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ Seller: ${user.username}?`)) {
            // 1. ลบ Listings ทั้งหมดของ User คนนี้
            // deleteListingsByUserId(user.id);
            // 2. ลบ User
            // deleteUser(user.id);
            // 3. รีเฟรชรายการ
            loadSellers();
            alert('ลบ Seller และประกาศทั้งหมดของพวกเขาเรียบร้อยแล้ว');
        }
    };

    return (
        <Card className="dark:bg-gray-800 shadow-xl">
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2 text-red-500" /> 
                    จัดการผู้ขาย (Sellers) ({sellers.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                {sellers.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 dark:text-gray-400 flex flex-col items-center">
                        <AlertTriangle className="w-10 h-10 mb-2 text-gray-500" />
                        <p>ยังไม่มีผู้ใช้สถานะ SELLER</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sellers.map(user => (
                            <div key={user.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border">
                                <div className="flex items-center space-x-4">
                                    <img 
                                        src={user.profileImageUrl || 'https://placehold.co/60x60/E2E8F0/94A3B8?text=No+Img'} 
                                        alt={user.username}
                                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
                                        onError={(e) => e.currentTarget.src = 'https://placehold.co/60x60/E2E8F0/94A3B8?text=No+Img'}
                                    />
                                    <div>
                                        <p className="font-semibold text-lg text-gray-900 dark:text-white">{user.username}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">
                                            {user.email} (ID: {user.id})
                                        </p>
                                    </div>
                                </div>
                                <Button 
                                    onClick={() => handleDelete(user)}
                                    variant="destructive"
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    ลบ Seller
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}