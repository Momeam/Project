'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation'; 
import { usePropertyStore } from '@/stores/usePropertyStore';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Phone, MessageSquare, Mail, MapPin, ArrowLeft, CheckCircle, Share2, Heart, Bed, Bath, Ruler, Loader2, Sparkles } from 'lucide-react';
import dynamic from 'next/dynamic';
import MortgageCalculator from '@/components/MortgageCalculator';
import RentalYieldCalculator from '@/components/RentalYieldCalculator';

export default function ListingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const MapDisplay = useMemo(() => dynamic(
        () => import('@/components/MapDisplay'),
        { loading: () => <div className="h-[400px] w-full bg-slate-50 rounded-2xl animate-pulse" />, ssr: false }
    ), []);

    const [isMounted, setIsMounted] = useState(false);
    const [activeImage, setActiveImage] = useState<string>('');
    
    const [apiProperty, setApiProperty] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // ⭐️ 1. เพิ่ม State เก็บข้อมูลคนขาย
    const [sellerInfo, setSellerInfo] = useState<any>(null);

    const getPropertyById = usePropertyStore((state) => state.getPropertyById);
    const toggleFavorite = usePropertyStore((state) => state.toggleFavorite);
    
    const storeProperty = getPropertyById(id);

    useEffect(() => { setIsMounted(true); }, []);

    // ดึงข้อมูลบ้าน
    useEffect(() => {
        const fetchPropertyDetail = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/properties/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    const safeData = {
                        ...data,
                        images: data.images || [], 
                        features: data.features || [],
                        contact: data.contact || { phoneNumber: '-', email: '-', line: '-' }
                    };
                    setApiProperty(safeData);
                }
            } catch (error) {
                console.error("Error fetching property:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (!storeProperty && id) {
            fetchPropertyDetail();
        } else {
            setIsLoading(false);
        }
    }, [id, storeProperty]);

    const property = storeProperty || apiProperty;

    // ⭐️ 2. เพิ่ม useEffect เพื่อดึงข้อมูลคนขายจาก Database (เทียบด้วย userId)
    useEffect(() => {
        const fetchSellerInfo = async () => {
            // ดักจับชื่อตัวแปรที่ส่งมาจาก Postgres (อาจจะเป็น userId หรือ userid)
            const ownerId = property?.userId || property?.userid; 
            if (ownerId) {
                try {
                    const res = await fetch('http://localhost:5000/api/users');
                    if (res.ok) {
                        const usersList = await res.json();
                        const matchedSeller = usersList.find((u: any) => String(u.id) === String(ownerId));
                        setSellerInfo(matchedSeller);
                    }
                } catch (err) {
                    console.error("Failed to fetch seller data");
                }
            }
        };

        if (property) fetchSellerInfo();
    }, [property]);

    useEffect(() => {
        if (property && property.images && property.images.length > 0) {
            setActiveImage(property.images[0].url);
        }
    }, [property]);

    // ⭐️ 3. ปรับให้ดึงข้อมูลจาก Database มาแสดงผลที่การ์ดฝั่งขวา
    const contactInfo = {
        name: sellerInfo?.username || 'ไม่ระบุชื่อ',
        phone: sellerInfo?.tel || '-',
        line: '-', // ใน DB เรายังไม่มีฟิลด์ Line 
        email: sellerInfo?.email || '-',
        image: null // รูปโปรไฟล์เดี๋ยวเราทำระบบอัปโหลดในอนาคตครับ
    };

    if (!isMounted) return null;

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                <span className="ml-3 text-slate-500">กำลังโหลดข้อมูล...</span>
            </div>
        );
    }

    if (!property) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <h1 className="text-2xl font-bold text-slate-800 mb-4">ไม่พบข้อมูลประกาศนี้</h1>
                <Button onClick={() => router.push('/')}>กลับสู่หน้าหลัก</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 py-8">
            <div className="container mx-auto px-4 max-w-6xl">
                {/* Breadcrumb & Actions */}
                <div className="flex justify-between items-center mb-6">
                    <Button variant="ghost" onClick={() => router.back()} className="text-slate-500 hover:text-slate-900 pl-0 hover:bg-transparent">
                        <ArrowLeft className="w-4 h-4 mr-2" /> ย้อนกลับ
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" className="rounded-full"><Share2 className="w-4 h-4" /></Button>
                        
                        <Button 
                            variant="outline" 
                            size="icon" 
                            className={`rounded-full transition-all ${property.isFavorite ? 'bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100' : 'hover:bg-slate-100'}`}
                            onClick={() => toggleFavorite(property.id)}
                        >
                            <Heart className={`w-4 h-4 ${property.isFavorite ? 'fill-rose-500' : ''}`} />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* --- ฝั่งซ้าย --- */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Gallery */}
                        <div className="space-y-4">
                            <div className="aspect-video bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 relative">
                                <img src={activeImage || 'https://placehold.co/800x600?text=No+Image'} alt={property.title} className="w-full h-full object-contain bg-slate-50" />
                                <span className={`absolute top-4 left-4 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide text-white shadow-lg ${property.type === 'SALE' ? 'bg-emerald-500' : 'bg-sky-500'}`}>
                                    {property.type === 'SALE' ? 'ขาย' : 'เช่า'}
                                </span>
                            </div>
                            {property.images && property.images.length > 1 && (
                                <div className="flex gap-3 overflow-x-auto pb-2">
                                    {property.images.map((img: any, index: number) => (
                                        <button key={index} onClick={() => setActiveImage(img.url)} className={`relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${activeImage === img.url ? 'border-slate-900 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                                            <img src={img.url} className="w-full h-full object-cover" alt="thumb" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Details */}
                        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">{property.title}</h1>
                                    <div className="flex items-center text-slate-500 text-sm">
                                        <MapPin className="w-4 h-4 mr-2 text-emerald-500" />
                                        {property.address} {property.province}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-bold text-slate-900">฿{property.price?.toLocaleString() || 0}</p>
                                    {property.type === 'RENT' && <p className="text-sm text-slate-500">ต่อเดือน</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-t border-b border-slate-100">
                                {[
                                    { label: 'ห้องนอน', val: property.bedrooms || 0, icon: Bed },
                                    { label: 'ห้องน้ำ', val: property.bathrooms || 0, icon: Bath },
                                    { label: 'พื้นที่', val: `${property.size || 0} ตร.ม.`, icon: Ruler },
                                    { label: 'ประเภท', val: property.category || '-', icon: CheckCircle }
                                ].map((item, i) => (
                                    <div key={i} className="text-center p-3 rounded-xl bg-slate-50">
                                        <item.icon className="w-5 h-5 mx-auto mb-2 text-slate-400" />
                                        <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                                        <p className="font-semibold text-slate-900">{item.val}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-3 tracking-tight">รายละเอียด</h3>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line text-lg">{property.description || "ไม่มีรายละเอียดเพิ่มเติม"}</p>
                            </div>
                            
                            {property.interiorDetails && (
                                <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-emerald-500" />
                                        จุดเด่นและรายละเอียดภายใน
                                    </h3>
                                    <div className="bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl p-6 border border-emerald-100 dark:border-emerald-900/50 shadow-inner">
                                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line text-lg italic">
                                            {property.interiorDetails}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Map & Calc */}
                        <div className="space-y-8">
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                <MapDisplay lat={property.latitude} lng={property.longitude} />
                            </div>
                            
                            {property.type === 'SALE' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                        <MortgageCalculator price={property.price || 0} />
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm">
                                        <RentalYieldCalculator price={property.price || 0} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* --- ฝั่งขวา --- */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-24 border-0 shadow-xl shadow-slate-200/50 bg-white rounded-2xl overflow-hidden">
                            <div className="bg-slate-900 h-24 w-full"></div>
                            <CardContent className="p-6 relative">
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                                    <div className="w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-white">
                                        {contactInfo.image ? (
                                            <img src={contactInfo.image} className="w-full h-full object-cover" alt="Seller" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300"><User className="w-10 h-10" /></div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-14 text-center mb-6">
                                    <h3 className="text-xl font-bold text-slate-900 flex items-center justify-center gap-1">
                                        {contactInfo.name}
                                        {sellerInfo?.role === 'SELLER' && <CheckCircle className="w-4 h-4 text-blue-500" />}
                                    </h3>
                                    <p className="text-sm text-slate-500">ID: {property.userId || property.userid}</p>
                                </div>

                                <div className="space-y-3">
                                    <a href={`tel:${contactInfo.phone}`} className="flex items-center p-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer">
                                        <Phone className="w-5 h-5 mr-3" />
                                        <span className="font-medium">{contactInfo.phone}</span>
                                    </a>
                                    <div className="flex items-center p-3 rounded-xl bg-slate-50 text-slate-700">
                                        <MessageSquare className="w-5 h-5 mr-3 text-green-500" />
                                        <span>{contactInfo.line}</span>
                                    </div>
                                    <div className="flex items-center p-3 rounded-xl bg-slate-50 text-slate-700">
                                        <Mail className="w-5 h-5 mr-3 text-blue-500" />
                                        <span className="truncate">{contactInfo.email}</span>
                                    </div>
                                </div>

                                <Button 
                                    onClick={() => {
                                        alert(`📞 เบอร์ติดต่อ: ${contactInfo.phone}\n💬 Line ID: ${contactInfo.line}\n✉️ อีเมล: ${contactInfo.email}`);
                                    }}
                                    className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white h-12 rounded-xl shadow-lg shadow-slate-900/20 text-base font-medium"
                                >
                                    ติดต่อสอบถาม
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}