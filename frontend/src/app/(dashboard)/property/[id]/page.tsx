'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { usePropertyStore } from '@/stores/usePropertyStore'
import { PropertyDetail } from '@/components/PropertyDetail'
import { Property } from '@/lib/types'

export default function PropertyPage() {
    const router = useRouter()
    const params = useParams()
    const propertyId = params.id as string
    const { getPropertyById, deleteProperty, incrementViewCount } = usePropertyStore()
    const [property, setProperty] = useState<Property | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isOwner, setIsOwner] = useState(false)

    useEffect(() => {
        if (!propertyId) {
            return
        }

        // Wrap in setTimeout to avoid cascading renders warning
        const timer = setTimeout(() => {
            const prop = getPropertyById(propertyId)
            if (prop) {
                setProperty(prop)
                incrementViewCount(propertyId)

                // Check if current user is owner
                const userId = localStorage.getItem('userId')
                setIsOwner(prop.userId === userId)
            }
            setIsLoading(false)
        }, 0)

        return () => clearTimeout(timer)
    }, [propertyId, getPropertyById, incrementViewCount])

    const handleEdit = () => {
        router.push(`/edit-property/${propertyId}`)
    }

    const handleDelete = () => {
        if (confirm('คุณแน่ใจหรือว่าต้องการลบประกาศนี้?')) {
            deleteProperty(propertyId)
            alert('ลบประกาศสำเร็จ')
            router.push('/')
        }
    }

    const handleContact = () => {
        if (property) {
            // สามารถใช้ API เพื่อส่งข้อความหรือ redirect ไปยังหน้าติดต่อ
            alert(`ติดต่อเจ้าของที่:\nโทร: ${property.contact.phoneNumber}\nอีเมล: ${property.contact.email}`)
        }
    }

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">กำลังโหลด...</div>
    }

    if (!property) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <p className="text-xl">ไม่พบประกาศ</p>
                <button
                    onClick={() => router.push('/')}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                    กลับไปหน้าหลัก
                </button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
            <PropertyDetail
                property={property}
                isOwner={isOwner}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onContact={handleContact}
            />
        </div>
    )
}
