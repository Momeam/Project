'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { usePropertyStore } from '@/stores/usePropertyStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useFavoriteStore } from '@/stores/useFavoriteStore'
import { PropertyCard } from '@/components/PropertyCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Heart, LayoutDashboard } from 'lucide-react'

export default function MyPropertiesPage() {
    const properties = usePropertyStore((state) => state.properties)
    const fetchProperties = usePropertyStore((state) => state.fetchProperties)
    
    // ป้องกัน Error ถ้า favoriteStore ยังเป็นของเก่า
    const favoriteIds = useFavoriteStore((state) => state.favoriteIds || new Set()) 
    
    // 🟢 เปลี่ยนจาก currentUser เป็น user ให้ตรงกับของจริง
    const user = useAuthStore((state) => state.user)
    const role = user?.role
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // ใช้ .finally เพื่อให้มั่นใจว่าโหลดเสร็จแล้วค่อยปิดวงล้อโหลด
        fetchProperties().finally(() => setIsLoading(false))
    }, [fetchProperties])

    const displayProperties = useMemo(() => {
        // แปลง id ให้เป็น string เพื่อให้เปรียบเทียบกันได้ชัวร์ๆ
        return properties.filter(p => favoriteIds.has(String(p.id)) || favoriteIds.has(Number(p.id)))
    }, [properties, favoriteIds])

    const isSeller = role === 'SELLER' || role === 'ADMIN'

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 pt-24">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* ========== ส่วนหัว ========== */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                            <Heart className="w-10 h-10 text-red-500 fill-red-500" /> รายการโปรด
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            อสังหาริมทรัพย์ที่คุณบันทึกไว้
                        </p>
                    </div>
                    {isSeller && (
                        <Link href="/user/dashboard">
                            <Button className="bg-slate-900 hover:bg-black text-white">
                                <LayoutDashboard className="w-4 h-4 mr-2" />
                                ไปที่หน้าจัดการประกาศ
                            </Button>
                        </Link>
                    )}
                </div>

                {/* ========== สถิติ ========== */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="dark:bg-gray-800 border-none shadow-sm">
                        <CardContent className="pt-6">
                            <p className="text-sm text-gray-600 dark:text-gray-400">จำนวนรายการโปรด</p>
                            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{displayProperties.length}</p>
                        </CardContent>
                    </Card>

                    <Card className="dark:bg-gray-800 border-none shadow-sm">
                        <CardContent className="pt-6">
                            <p className="text-sm text-gray-600 dark:text-gray-400">ประเภท: ขาย</p>
                            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                                {displayProperties.filter((p) => p.type === 'SALE').length}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="dark:bg-gray-800 border-none shadow-sm">
                        <CardContent className="pt-6">
                            <p className="text-sm text-gray-600 dark:text-gray-400">ประเภท: เช่า</p>
                            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                {displayProperties.filter((p) => p.type === 'RENT').length}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* ========== ส่วนแสดงผล ========== */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-64 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-xl"></div>
                        ))}
                    </div>
                ) : displayProperties.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
                        <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <p className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-4">
                            คุณยังไม่มีรายการโปรด
                        </p>
                        <Link href="/buy">
                            <Button className="bg-blue-600 hover:bg-blue-700">
                                ไปหาบ้านที่ถูกใจกัน!
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayProperties.map((property) => (
                            <PropertyCard key={property.id} property={property} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}