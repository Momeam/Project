'use client'

import React from 'react'
import Image from 'next/image'
import { Property } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Phone, Mail, Facebook, Home, Ruler, DoorOpen, Droplet, Building2, Calendar, Sparkles } from 'lucide-react'

interface PropertyDetailProps {
    property: Property
    isOwner?: boolean
    onEdit?: () => void
    onDelete?: () => void
    onContact?: () => void
}

export function PropertyDetail({
    property,
    isOwner = false,
    onEdit,
    onDelete,
    onContact,
}: PropertyDetailProps) {
    const pricePerSqm = property.size > 0 ? property.price / property.size : 0

    return (
        <div className="w-full max-w-5xl mx-auto py-8 px-4 space-y-6">
            {/* ========== ส่วนภาพและชื่อ ========== */}
            <Card className="overflow-hidden dark:bg-gray-800">
                <div className="space-y-4">
                    {/* ภาพหลัก */}
                    {property.images.length > 0 && (
                        <div className="relative w-full h-96 bg-gray-200 dark:bg-gray-700">
                            <Image
                                src={property.images[0].url}
                                alt={property.title}
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>
                    )}

                    {/* ข้อมูลหลัก */}
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                                    <MapPin className="w-4 h-4" />
                                    <span>{property.address}, {property.district}, {property.province}</span>
                                </div>
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                                    property.type === 'SALE'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                }`}>
                                    {property.type === 'SALE' ? '🏷️ ขาย' : '🔑 เช่า'}
                                </span>
                            </div>

                            {isOwner && (
                                <div className="flex gap-2">
                                    <Button onClick={onEdit} variant="outline">
                                        แก้ไข
                                    </Button>
                                    <Button onClick={onDelete} variant="destructive">
                                        ลบ
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* ราคา */}
                        <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">ราคา</p>
                            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                ฿{property.price.toLocaleString('th-TH')}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                ฿{pricePerSqm.toLocaleString('th-TH', { maximumFractionDigits: 0 })} / ตร.ม.
                            </p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* ========== ภาพอื่นๆ ========== */}
            {property.images.length > 1 && (
                <Card className="dark:bg-gray-800">
                    <CardHeader>
                        <CardTitle>ภาพเพิ่มเติม</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {property.images.slice(1).map((image, index) => (
                                <div key={index} className="relative w-full h-32">
                                    <Image
                                        src={image.url}
                                        alt={`${property.title} ${index + 2}`}
                                        fill
                                        className="object-cover rounded-lg"
                                    />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ========== ส่วนซ้าย: รายละเอียด ========== */}
                <div className="lg:col-span-2 space-y-6">
                    {/* รายละเอียดทั่วไป */}
                    <Card className="dark:bg-gray-800">
                        <CardHeader>
                            <CardTitle>รายละเอียด</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                {property.description}
                            </p>
                            {property.interiorDetails && (
                                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-slate-900 dark:text-white">
                                        <Sparkles className="w-5 h-5 text-emerald-500" />
                                        รายละเอียดภายในและตกแต่ง
                                    </h3>
                                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed italic bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                                        {property.interiorDetails}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* ข้อมูลอสังหาริมทรัพย์ */}
                    <Card className="dark:bg-gray-800">
                        <CardHeader>
                            <CardTitle>ข้อมูลอสังหาริมทรัพย์</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                <div className="text-center">
                                    <Ruler className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                                    <p className="text-sm text-gray-600 dark:text-gray-400">ขนาด</p>
                                    <p className="text-lg font-semibold">{property.size} ตร.ม.</p>
                                </div>

                                <div className="text-center">
                                    <DoorOpen className="w-6 h-6 mx-auto mb-2 text-green-500" />
                                    <p className="text-sm text-gray-600 dark:text-gray-400">ห้องนอน</p>
                                    <p className="text-lg font-semibold">{property.bedrooms} ห้อง</p>
                                </div>

                                <div className="text-center">
                                    <Droplet className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                                    <p className="text-sm text-gray-600 dark:text-gray-400">ห้องน้ำ</p>
                                    <p className="text-lg font-semibold">{property.bathrooms} ห้อง</p>
                                </div>

                                {property.floors !== undefined && property.floors > 0 && (
                                    <div className="text-center">
                                        <Building2 className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                                        <p className="text-sm text-gray-600 dark:text-gray-400">จำนวนชั้น</p>
                                        <p className="text-lg font-semibold">{property.floors} ชั้น</p>
                                    </div>
                                )}

                                {property.yearBuilt !== undefined && property.yearBuilt > 0 && (
                                    <div className="text-center">
                                        <Calendar className="w-6 h-6 mx-auto mb-2 text-red-500" />
                                        <p className="text-sm text-gray-600 dark:text-gray-400">ปีที่สร้าง</p>
                                        <p className="text-lg font-semibold">{property.yearBuilt}</p>
                                    </div>
                                )}

                                {property.size > 0 && (
                                    <div className="text-center">
                                        <Home className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                                        <p className="text-sm text-gray-600 dark:text-gray-400">ราคา/ตร.ม.</p>
                                        <p className="text-lg font-semibold">
                                            ฿{pricePerSqm.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* สิ่งอำนวยความสะดวก */}
                    {property.features.length > 0 && (
                        <Card className="dark:bg-gray-800">
                            <CardHeader>
                                <CardTitle>สิ่งอำนวยความสะดวก</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {property.features.map((feature, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-sm"
                                        >
                                            ✓ {feature}
                                        </span>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* การคำนวนดอกเบี้ย (ถ้าเป็นการขาย) */}
                    {property.type === 'SALE' && property.downPaymentPercent !== undefined && property.downPaymentPercent > 0 && property.interestRate !== undefined && property.interestRate > 0 && (
                        <Card className="dark:bg-gray-800">
                            <CardHeader>
                                <CardTitle>💰 การคำนวนการชำระสำหรับผู้ซื้อ</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">เงินดาวน์</p>
                                        <p className="text-lg font-semibold">
                                            ฿{(property.price * property.downPaymentPercent / 100).toLocaleString('th-TH', { maximumFractionDigits: 0 })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">จำนวนเงินกู้</p>
                                        <p className="text-lg font-semibold">
                                            ฿{(property.price * (100 - property.downPaymentPercent) / 100).toLocaleString('th-TH', { maximumFractionDigits: 0 })}
                                        </p>
                                    </div>
                                </div>

                                {property.loanTerm !== undefined && property.loanTerm > 0 && (
                                    <div className="bg-green-50 dark:bg-green-900 p-3 rounded-lg border border-green-200 dark:border-green-700">
                                        <p className="text-sm text-gray-600 dark:text-gray-300">การชำระรายเดือน</p>
                                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                            ฿{(() => {
                                                const principal = property.price * ((100 - property.downPaymentPercent) / 100)
                                                const monthlyRate = property.interestRate / 100 / 12
                                                const payments = property.loanTerm

                                                if (monthlyRate === 0) return (principal / payments).toLocaleString('th-TH', { maximumFractionDigits: 0 })

                                                const payment = (principal * (monthlyRate * Math.pow(1 + monthlyRate, payments))) / (Math.pow(1 + monthlyRate, payments) - 1)
                                                return payment.toLocaleString('th-TH', { maximumFractionDigits: 0 })
                                            })()}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            เป็นเวลา {property.loanTerm} เดือน ({(property.loanTerm / 12).toFixed(1)} ปี) ที่ {property.interestRate}% ต่อปี
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* ========== ส่วนขวา: ข้อมูลติดต่อ ========== */}
                <div className="space-y-6">
                    <Card className="dark:bg-gray-800 sticky top-4">
                        <CardHeader>
                            <CardTitle>📞 ติดต่อเจ้าของ</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* เบอร์โทร */}
                            <div className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-blue-500" />
                                <div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">เบอร์โทรศัพท์</p>
                                    <a href={`tel:${property.contact.phoneNumber}`} className="text-sm font-semibold hover:text-blue-500">
                                        {property.contact.phoneNumber}
                                    </a>
                                </div>
                            </div>

                            {/* อีเมล */}
                            <div className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-red-500" />
                                <div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">อีเมล</p>
                                    <a href={`mailto:${property.contact.email}`} className="text-sm font-semibold hover:text-blue-500 break-all">
                                        {property.contact.email}
                                    </a>
                                </div>
                            </div>

                            {/* Line */}
                            {property.contact.line && (
                                <div className="flex items-center gap-3">
                                    <Phone className="w-5 h-5 text-green-500" />
                                    <div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Line</p>
                                        <a href={`https://line.me/ti/p/${property.contact.line.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold hover:text-blue-500">
                                            {property.contact.line}
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Facebook */}
                            {property.contact.facebook && (
                                <div className="flex items-center gap-3">
                                    <Facebook className="w-5 h-5 text-blue-600" />
                                    <div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Facebook</p>
                                        <a href={`https://facebook.com/${property.contact.facebook}`} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold hover:text-blue-500 truncate">
                                            {property.contact.facebook}
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* ปุ่มติดต่อ */}
                            <Button
                                onClick={onContact}
                                className="w-full bg-green-600 hover:bg-green-700"
                            >
                                📨 ติดต่อเจ้าของที่ดิน
                            </Button>

                            {/* ข้อมูลเพิ่มเติม */}
                            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                <p>📅 สร้างเมื่อ: {new Date(property.createdAt).toLocaleDateString('th-TH')}</p>
                                <p>👁️ จำนวนการเข้าดู: {property.viewCount}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
