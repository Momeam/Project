'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePropertyStore } from '@/stores/usePropertyStore'
import { PropertyCard } from '@/components/PropertyCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, ListTodo } from 'lucide-react'
import { Property } from '@/lib/types'

export default function MyPropertiesPage() {
    const { getUserProperties } = usePropertyStore()
    const [properties, setProperties] = useState<Property[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const timer = setTimeout(() => {
            const userId = localStorage.getItem('userId') || ''
            const userProps = getUserProperties(userId)
            setProperties(userProps)
            setIsLoading(false)
        }, 0)

        return () => clearTimeout(timer)
    }, [getUserProperties])

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* ========== ส่วนหัว ========== */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">📋 ประกาศของฉัน</h1>
                        <p className="text-gray-600 dark:text-gray-400">จัดการประกาศอสังหาริมทรัพย์ของคุณ</p>
                    </div>
                    <Link href="/create-property">
                        <Button className="bg-green-600 hover:bg-green-700">
                            <Plus className="w-4 h-4 mr-2" />
                            เพิ่มประกาศใหม่
                        </Button>
                    </Link>
                </div>

                {/* ========== สถิติ ========== */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="dark:bg-gray-800">
                        <CardContent className="pt-6">
                            <p className="text-sm text-gray-600 dark:text-gray-400">จำนวนประกาศทั้งหมด</p>
                            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{properties.length}</p>
                        </CardContent>
                    </Card>

                    <Card className="dark:bg-gray-800">
                        <CardContent className="pt-6">
                            <p className="text-sm text-gray-600 dark:text-gray-400">ประกาศขาย</p>
                            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                                {properties.filter((p) => p.type === 'SALE').length}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="dark:bg-gray-800">
                        <CardContent className="pt-6">
                            <p className="text-sm text-gray-600 dark:text-gray-400">ประกาศเช่า</p>
                            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                {properties.filter((p) => p.type === 'RENT').length}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* ========== ส่วนแสดงผล ========== */}
                {isLoading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600 dark:text-gray-400">กำลังโหลด...</p>
                    </div>
                ) : properties.length === 0 ? (
                    <div className="text-center py-12">
                        <ListTodo className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <p className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-4">
                            คุณยังไม่มีประกาศ
                        </p>
                        <Link href="/create-property">
                            <Button className="bg-green-600 hover:bg-green-700">
                                <Plus className="w-4 h-4 mr-2" />
                                สร้างประกาศแรกของคุณ
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {properties.map((property) => (
                                <PropertyCard key={property.id} property={property} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
