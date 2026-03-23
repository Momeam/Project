'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { usePropertyStore } from '@/stores/usePropertyStore'
import { PropertyForm } from '@/components/PropertyForm'
import { Property } from '@/lib/types'

export default function EditPropertyPage() {
    const router = useRouter()
    const params = useParams()
    const propertyId = params.id as string
    const { getPropertyById } = usePropertyStore()
    const [property, setProperty] = useState<Property | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isOwner, setIsOwner] = useState(false)

    useEffect(() => {
        if (!propertyId) return

        const timer = setTimeout(() => {
            const prop = getPropertyById(propertyId)
            if (prop) {
                // Check if current user is owner
                const userId = localStorage.getItem('userId')
                if (prop.userId === userId) {
                    setProperty(prop)
                    setIsOwner(true)
                } else {
                    alert('คุณไม่มีสิทธิ์แก้ไขประกาศนี้')
                    router.push('/')
                }
            } else {
                alert('ไม่พบประกาศ')
                router.push('/')
            }
            setIsLoading(false)
        }, 0)

        return () => clearTimeout(timer)
    }, [propertyId, getPropertyById, router])

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">กำลังโหลด...</div>
    }

    if (!isOwner || !property) {
        return <div className="min-h-screen flex items-center justify-center">ไม่มีสิทธิ์เข้าถึง</div>
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
            <PropertyForm property={property} isEdit={true} />
        </div>
    )
}
