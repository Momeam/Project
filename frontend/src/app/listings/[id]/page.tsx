'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation'; 
import { usePropertyStore } from '@/stores/usePropertyStore';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Phone, MessageSquare, MapPin, ArrowLeft, CheckCircle, Share2, Heart, Bed, Bath, Ruler, Loader2, Sparkles, Eye, Trash2, LayoutGrid, X, Maximize2, Utensils, Coffee, Smartphone as Tv, AlignLeft } from 'lucide-react';
import dynamic from 'next/dynamic';
import MortgageCalculator from '@/components/MortgageCalculator';
import RentalYieldCalculator from '@/components/RentalYieldCalculator';
import FloorPlanBuilder from '@/components/FloorPlanBuilder';
import PropertyLayoutViewer from '@/components/PropertyLayoutViewer';

import { useFavoriteStore } from '@/stores/useFavoriteStore';
import { useAuthStore } from '@/stores/useAuthStore'; 
import { authFetch, getAuthHeaders } from '@/lib/authFetch';

// 🟢 1. ย้ายการโหลด MapDisplay ออกมาข้างนอก Component ป้องกัน React แครช
const MapDisplay = dynamic(
    () => import('@/components/MapDisplay'),
    { ssr: false, loading: () => <div className="h-[400px] w-full bg-slate-50 rounded-2xl animate-pulse flex items-center justify-center text-gray-400">กำลังโหลดแผนที่...</div> }
);

export default function ListingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [isMounted, setIsMounted] = useState(false);
    const [activeImage, setActiveImage] = useState<string>('');
    
    const [apiProperty, setApiProperty] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [inquiryMessage, setInquiryMessage] = useState('');
    const [isSendingInquiry, setIsSendingInquiry] = useState(false);
    const [sellerInfo, setSellerInfo] = useState<any>(null);
    const [units, setUnits] = useState<any[]>([]);
    const [selectedUnit, setSelectedUnit] = useState<any>(null);
    const [showBuilder, setShowBuilder] = useState(false);
    const [activeFloorTab, setActiveFloorTab] = useState<number | null>(null);

    // 🟢 2. ดึงฟังก์ชันอย่างปลอดภัย ป้องกันบัค "is not a function"
    const getPropertyById = usePropertyStore((state) => state.getPropertyById); 
    
    // เซฟการดึงค่า favorite
    const favoriteIds = useFavoriteStore((state) => state.favoriteIds || []);
    const toggleFavorite = useFavoriteStore((state) => state.toggleFavorite);
    
    const user = useAuthStore((state) => state.currentUser); 
    
    // ดึงข้อมูลประกาศ
    const storeProperty = typeof getPropertyById === 'function' ? getPropertyById(id) : null;
    const property = storeProperty || apiProperty;

    // 🟢 3. ตัวกรองรูปภาพ ป้องกัน Database ส่งรูปมาเป็น String แล้วแครช
    const safeImages = useMemo(() => {
        if (!property?.images) return [];
        if (typeof property.images === 'string') {
            try { return JSON.parse(property.images); } catch { return []; }
        }
        return Array.isArray(property.images) ? property.images : [];
    }, [property]);

    useEffect(() => { 
        setIsMounted(true); 
    }, []);

    // ดึงข้อมูลบ้านจาก API จริง (ดึงทุกครั้งเพื่อให้ได้ข้อมูล units ล่าสุด)
    useEffect(() => {
        if (!id) return;
        const fetchPropertyDetail = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `/api`}/properties/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setApiProperty(data);
                    if (data.units) setUnits(data.units);
                }
            } catch (error) {
                console.error("Error fetching property:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPropertyDetail();
    }, [id]);

    // ตรวจสอบสิทธิ์ในการลบ
    const canDelete = useMemo(() => {
        if (!user || !property) return false;
        return user.role === 'ADMIN' || String(user.id) === String(property.userId || property.userid);
    }, [user, property]);

    const handleDelete = async () => {
        if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบประกาศนี้?')) {
            try {
                // ยิงลบ API ตรงๆ เลย
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `/api`}/properties/${property.id}`, { method: 'DELETE' });
                if (res.ok) {
                    alert('ลบประกาศเรียบร้อย!');
                    router.push('/');
                } else {
                    alert('ลบประกาศไม่สำเร็จ');
                }
            } catch (error) {
                console.error('Failed to delete property:', error);
            }
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try { await navigator.share({ title: property?.title, url: window.location.href }); } catch (err) {}
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('คัดลอกลิงก์เรียบร้อยแล้ว!');
        }
    };

    const handleSendInquiry = async () => {
        if (!inquiryMessage.trim()) return alert('กรุณากรอกข้อความ');
        setIsSendingInquiry(true);
        try {
            const { sendInquiry } = await import('@/actions/listings');
            const result = await sendInquiry(id, property.userId, inquiryMessage);
            alert(result.message);
            if (result.success) setInquiryMessage('');
        } catch (error) {
            alert('ส่งข้อความไม่สำเร็จ');
        } finally {
            setIsSendingInquiry(false);
        }
    };

    useEffect(() => {
        if (property && property.owner_name) {
            setSellerInfo({
                username: property.owner_name, tel: property.owner_tel, line_id: property.owner_line
            });
        }
    }, [property]);

    const handleUpdateUnitDetail = async (unitId: number, updateData: any) => {
        try {
            const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL || `/api`}/properties/units/${unitId}`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify(updateData)
            });

            if (res.ok) {
                const updatedUnit = (await res.json()).unit;
                setUnits(prev => prev.map(u => u.id === unitId ? updatedUnit : u));
                if (selectedUnit?.id === unitId) setSelectedUnit(updatedUnit);
            } else {
                alert('อัปเดตข้อมูลไม่สำเร็จ')
            }
        } catch (error) {
            console.error('Error updating unit', error);
        }
    };

    const handleUpdateUnitStatus = async (unitId: number, nextStatus: string) => {
        await handleUpdateUnitDetail(unitId, { status: nextStatus });
    };

    const handleBookUnit = async (unitId: number) => {
        await handleUpdateUnitStatus(unitId, 'BOOKED');
        alert('🎉 ยินดีด้วย! การจองห้องของคุณสำเร็จแล้ว! (Demo)');
        setSelectedUnit(null);
    };

    // จัดกลุ่มห้องตามชั้น (Grouping units by floor)
    const floorsMap = useMemo(() => {
        return units.reduce((acc: any, unit: any) => {
            if (!acc[unit.floor_number]) acc[unit.floor_number] = [];
            acc[unit.floor_number].push(unit);
            return acc;
        }, {});
    }, [units]);
    
    // เรียงชั้นจากบนลงล่าง และกรองให้เหลือเฉพาะชั้นที่อยู่ในช่วง total_floors (ถ้ามีระบุ)
    const sortedFloors = useMemo(() => {
        const floors = Object.keys(floorsMap).map(Number);
        
        // ดึงขีดจำกัดชั้นจาก DB (snake_case) หรือ state (camelCase)
        const dbLimit = property?.total_floors || property?.totalFloors;
        
        // ถ้ามีขีดจำกัด แต่ขีดจำกัดน้อยกว่าชั้นจริงที่มีห้องพัก ให้ขยายขีดจำกัดให้ครอบคลุม (เพื่อซัพพอร์ตข้อมูลเก่า)
        const realMaxFloor = floors.length > 0 ? Math.max(...floors) : 1;
        const limit = dbLimit ? Math.max(dbLimit, realMaxFloor) : realMaxFloor;
        
        return floors.filter(f => f <= limit).sort((a, b) => b - a);
    }, [floorsMap, property]);

    // ตั้งค่าชั้นเริ่มต้น เป็นชั้นต่ำสุดที่มีห้องพัก (ยกเว้นชั้น 1 ถ้ามีชั้นอื่น)
    useEffect(() => {
        if (sortedFloors.length > 0 && activeFloorTab === null) {
            // เลือกชั้นต่ำสุดที่ไม่ใช่ชั้น 1 (ถ้ามี) เพราะชั้น 1 มักเป็นล็อบบี้
            const nonGroundFloors = sortedFloors.filter(f => f > 1);
            const startFloor = nonGroundFloors.length > 0 
                ? nonGroundFloors[nonGroundFloors.length - 1]  // ชั้น 2 (ต่ำสุดจากที่เรียงจากมากไปน้อย)
                : sortedFloors[sortedFloors.length - 1];
            setActiveFloorTab(startFloor);
        }
    }, [sortedFloors]);

    // เซ็ตภาพแรกตอนโหลด
    useEffect(() => {
        if (safeImages.length > 0) {
            setActiveImage(safeImages[0].url || safeImages[0].image_url || safeImages[0]);
        }
    }, [safeImages]);

    const contactInfo = {
        name: sellerInfo?.username || 'ไม่ระบุชื่อ',
        phone: sellerInfo?.tel || '-',
        line: sellerInfo?.line_id || '-', 
        image: null
    };

    // 🟢 4. Renderer สำหรับผังห้องภายใน (Internal Layout)
    const renderRoomLayout = (unit: any) => {
        const layout = unit.layout_json;
        if (!layout || !layout.components || layout.components.length === 0) {
            return (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                    <p className="text-xs italic">ยังไม่มีการจัดวางผังภายใน</p>
                    <div className="flex gap-2">
                        <Bed className="w-4 h-4 opacity-30" />
                        <Bath className="w-4 h-4 opacity-30" />
                    </div>
                </div>
            );
        }

        return (
            <div className="relative w-full h-full bg-white rounded-xl overflow-hidden border border-slate-100 shadow-inner">
                {layout.components.map((comp: any) => {
                    const type = comp.type;
                    return (
                        <div
                            key={comp.id}
                            className={`absolute flex flex-col items-center justify-center p-1 rounded-lg border-2 text-[8px] font-black uppercase
                                ${type === 'BED' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : ''}
                                ${type === 'BATH' ? 'bg-blue-50 border-blue-100 text-blue-600' : ''}
                                ${type === 'KITCHEN' ? 'bg-orange-50 border-orange-100 text-orange-600' : ''}
                                ${type === 'LIVING' ? 'bg-purple-50 border-purple-100 text-purple-600' : ''}
                                ${type === 'TV' ? 'bg-slate-50 border-slate-100 text-slate-500' : ''}
                                ${type === 'BALCONY' ? 'bg-cyan-50 border-cyan-100 text-cyan-600' : ''}
                            `}
                            style={{
                                left: `${comp.x * 10}%`,
                                top: `${comp.y * 10}%`,
                                width: `${comp.w * 10}%`,
                                height: `${comp.h * 10}%`
                            }}
                        >
                            {type === 'BED' && <Bed className="w-4 h-4 mb-0.5" />}
                            {type === 'BATH' && <Bath className="w-3 h-3 mb-0.5" />}
                            {type === 'KITCHEN' && <Utensils className="w-3 h-3 mb-0.5" />}
                            {type === 'LIVING' && <Coffee className="w-3 h-3 mb-0.5" />}
                            {type === 'TV' && <Tv className="w-3 h-3 mb-0.5" />}
                            <span className="truncate w-full text-center">{type}</span>
                        </div>
                    );
                })}
            </div>
        );
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
        <div className="min-h-screen bg-slate-50/50 pt-32 pb-8">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="flex justify-between items-center mb-6">
                    <Button variant="ghost" onClick={() => router.back()} className="text-slate-500 hover:text-slate-900 pl-0 hover:bg-transparent">
                        <ArrowLeft className="w-4 h-4 mr-2" /> ย้อนกลับ
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" className="rounded-full" onClick={handleShare}>
                            <Share2 className="w-4 h-4" />
                        </Button>
                        <Button 
                            variant="outline" size="icon" 
                            className={`rounded-full transition-all ${favoriteIds.includes(String(property.id)) ? 'bg-rose-50 border-rose-200 text-rose-500' : ''}`}
                            onClick={() => typeof toggleFavorite === 'function' && toggleFavorite(property.id)}
                        >
                            <Heart className={`w-4 h-4 ${favoriteIds.includes(String(property.id)) ? 'fill-rose-500' : ''}`} />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Gallery */}
                        <div className="space-y-4">
                            <div className="aspect-video bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 relative">
                                <img src={activeImage || 'https://placehold.co/800x600?text=No+Image'} alt={property.title} className="w-full h-full object-cover bg-slate-50" />
                                <span className={`absolute top-4 left-4 px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-lg ${property.type === 'SALE' ? 'bg-emerald-500' : 'bg-sky-500'}`}>
                                    {property.type === 'SALE' ? 'ขาย' : 'เช่า'}
                                </span>
                            </div>
                            {safeImages.length > 1 && (
                                <div className="flex gap-3 overflow-x-auto pb-2">
                                    {safeImages.map((img: any, index: number) => {
                                        const imageUrl = img.url || img.image_url || img;
                                        return (
                                            <button 
                                                key={index} 
                                                onClick={() => setActiveImage(imageUrl)} 
                                                className={`relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${activeImage === imageUrl ? 'border-slate-900 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                            >
                                                <img src={imageUrl} className="w-full h-full object-cover" alt="thumb" />
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Details */}
                        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">{property.title}</h1>
                                    <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 text-slate-500 text-sm">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-emerald-500" />
                                            <span>{property.address} {property.province}</span>
                                        </div>
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
                                <p className="text-slate-600 leading-relaxed whitespace-pre-line text-lg">{property.description || "ไม่มีรายละเอียดเพิ่มเติม"}</p>
                            </div>
                        </div>

                        {/* ========== Interactive Floor Plan / Seat Booking ========== */}
                        {property?.is_project && units.length > 0 && (
                            <div className="bg-white p-8 rounded-2xl border-2 border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.1)] overflow-hidden">
                                <div className="border-b border-slate-100 pb-4 mb-6">
                                    <h3 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                                        <LayoutGrid className="w-6 h-6 text-emerald-500" />
                                        ผังห้องโครงการ (Interactive Floor Plan)
                                    </h3>
                                    <div className="flex justify-between items-end mt-2">
                                        <p className="text-sm text-slate-500">
                                            เลือกดูสถานะของแต่ละห้องในโครงการ
                                        </p>
                                    </div>
                                </div>
                                 <div className="p-2">
                                    {/* Legend */}
                                    <div className="flex flex-wrap gap-4 items-center justify-center mb-8 text-[10px] sm:text-xs font-semibold bg-slate-50 p-4 rounded-2xl">
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-sm shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div> ว่าง (Available)</div>
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-400 rounded-sm shadow-[0_0_8px_rgba(250,204,21,0.4)]"></div> จองแล้ว (Booked)</div>
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-rose-500 rounded-sm shadow-[0_0_8px_rgba(244,63,94,0.4)]"></div> ขายแล้ว (Sold)</div>
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-slate-300 rounded-sm"></div> ประตู/หน้าต่าง</div>
                                    </div>

                                    <div className="flex flex-col md:flex-row gap-8">
                                        {/* Floor Selector Sidebar */}
                                        <div className="w-full md:w-48 flex-shrink-0 space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-4 px-2">เลือกชั้น</p>
                                            {sortedFloors.map(floor => {
                                                const availableCount = floorsMap[floor].filter((u: any) => u.status === 'AVAILABLE' && u.unit_type === 'ROOM').length;
                                                const isActive = activeFloorTab === floor;
                                                
                                                return (
                                                    <button
                                                        key={floor}
                                                        onClick={() => setActiveFloorTab(floor)}
                                                        className={`w-full group flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all duration-200
                                                            ${isActive 
                                                                ? 'bg-slate-900 border-slate-900 text-white shadow-lg scale-[1.02]' 
                                                                : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                                            }
                                                        `}
                                                    >
                                                        <div className="text-left">
                                                            <p className="text-xs font-bold">ชั้น {floor}</p>
                                                            <p className={`text-[9px] ${isActive ? 'text-slate-400' : 'text-slate-400'}`}>
                                                                {availableCount > 0 ? `ว่าง ${availableCount} ห้อง` : 'เต็มแล้ว'}
                                                            </p>
                                                        </div>
                                                        {availableCount > 0 && !isActive && (
                                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Grid Content */}
                                        <div className="flex-1 bg-slate-50/50 rounded-[2rem] border border-slate-100 p-6 flex items-center justify-center min-h-[550px] relative overflow-hidden group">
                                            {/* Blueprint Grid Background */}
                                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `radial-gradient(#000 1px, transparent 1px)`, backgroundSize: '20px 20px' }}></div>
                                            
                                            {activeFloorTab && floorsMap[activeFloorTab] ? (
                                                <div 
                                                    className="relative bg-white rounded-2xl shadow-xl border border-slate-200 transition-all duration-500"
                                                    style={{ 
                                                        width: 440, 
                                                        height: 440, 
                                                        display: 'block'
                                                    }}
                                                >
                                                    {/* Blueprint Lines */}
                                                    <div className="absolute inset-0 pointer-events-none opacity-[0.05]" 
                                                         style={{ 
                                                            backgroundImage: `linear-gradient(to right, #475569 1px, transparent 1px), linear-gradient(to bottom, #475569 1px, transparent 1px)`,
                                                            backgroundSize: '22px 22px'
                                                         }}
                                                    ></div>

                                                    {floorsMap[activeFloorTab].map((unit: any) => {
                                                        const isHallway = unit.unit_type === 'HALLWAY';
                                                        const isLift = unit.unit_type === 'LIFT';
                                                        const isExit = unit.unit_type === 'EXIT';
                                                        const isRoom = unit.unit_type === 'ROOM';
                                                        
                                                        return (
                                                            <button
                                                                key={unit.id}
                                                                onClick={() => isRoom && setSelectedUnit(unit)}
                                                                disabled={!isRoom}
                                                                title={!isRoom ? unit.room_number : `ห้อง ${unit.room_number} - ${unit.status === 'AVAILABLE' ? 'ว่าง' : unit.status === 'BOOKED' ? 'ติดจอง' : 'ขายแล้ว'}`}
                                                                className={`absolute transition-all duration-300 flex flex-col items-center justify-center font-bold
                                                                    ${isRoom ? 'hover:z-20 hover:scale-105 active:scale-95 shadow-sm rounded-lg border-2' : 'cursor-default opacity-80'}
                                                                    ${isHallway ? 'bg-slate-100 border border-slate-200 rounded-none opacity-50' : ''}
                                                                    ${isLift ? 'bg-blue-50 border border-blue-200 text-blue-600 rounded-lg' : ''}
                                                                    ${isExit ? 'bg-rose-50 border border-rose-200 text-rose-600 rounded-lg' : ''}
                                                                    ${!isRoom && !isHallway && !isLift && !isExit ? 'bg-slate-200 border border-slate-300 text-slate-600 rounded-lg' : ''}
                                                                    ${isRoom && unit.status === 'AVAILABLE' ? 'bg-emerald-50 border-emerald-400 text-emerald-700 hover:bg-emerald-500 hover:text-white' : ''}
                                                                    ${isRoom && unit.status === 'BOOKED' ? 'bg-yellow-50 border-yellow-400 text-yellow-700 hover:bg-yellow-400 hover:text-white' : ''}
                                                                    ${isRoom && unit.status === 'SOLD' ? 'bg-rose-50 border-rose-400 text-rose-700 opacity-80 hover:opacity-100 hover:bg-rose-500 hover:text-white' : ''}
                                                                `}
                                                                style={{
                                                                    left: `${((unit.grid_x || 0) / 20) * 100}%`,
                                                                    top: `${((unit.grid_y || 0) / 20) * 100}%`,
                                                                    width: `${((unit.grid_w || 1) / 20) * 100}%`,
                                                                    height: `${((unit.grid_h || 1) / 20) * 100}%`,
                                                                    fontSize: unit.grid_w < 2 ? '8px' : '10px'
                                                                }}
                                                            >
                                                                {!isHallway && (
                                                                    <>
                                                                        <span className="truncate w-full px-1">{unit.room_number}</span>
                                                                        {isLift && <Maximize2 className="w-2 h-2 mt-0.5" />}
                                                                        {isExit && <X className="w-2 h-2 mt-0.5" />}
                                                                    </>
                                                                )}

                                                                {/* Orientation Icons */}
                                                                {unit.door_side && (
                                                                    <div className={`absolute w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_5px_rgba(59,130,246,0.5)] ${
                                                                        unit.door_side === 'TOP' ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2' :
                                                                        unit.door_side === 'BOTTOM' ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2' :
                                                                        unit.door_side === 'LEFT' ? 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2' :
                                                                        'right-0 top-1/2 translate-x-1/2 -translate-y-1/2'
                                                                    }`}></div>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-4 text-slate-300">
                                                    <LayoutGrid className="w-16 h-16 opacity-20" />
                                                    <p className="text-sm font-bold opacity-40">ไม่มีข้อมูลผังห้องในชั้นนี้</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ========== Floor Plan / Blueprint ========== */}
                        <PropertyLayoutViewer property={property} />

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

                    {/* --- ฝั่งขวา (Contact) --- */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-24 border-0 shadow-xl shadow-slate-200/50 bg-white rounded-2xl overflow-hidden">
                            <div className="bg-slate-900 h-24 w-full"></div>
                            <CardContent className="p-6 relative">
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                                    <div className="w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-white">
                                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300"><User className="w-10 h-10" /></div>
                                    </div>
                                </div>

                                <div className="mt-14 text-center mb-6">
                                    <h3 className="text-xl font-bold text-slate-900 flex items-center justify-center gap-1">
                                        {contactInfo.name}
                                    </h3>
                                    <p className="text-sm text-slate-500">ID ประกาศ: {property.id || '-'}</p>
                                </div>

                                <div className="space-y-3">
                                    <Button asChild className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-lg shadow-lg transition-all hover:scale-[1.02]">
                                        <a href={`tel:${contactInfo.phone}`}>
                                            <Phone className="w-5 h-5 mr-2" /> โทรหาเจ้าของ
                                        </a>
                                    </Button>

                                    {canDelete && (
                                        <Button 
                                            onClick={handleDelete}
                                            variant="destructive" 
                                            className="w-full h-14 rounded-2xl font-bold text-lg shadow-lg transition-all hover:scale-[1.02]"
                                        >
                                            <Trash2 className="w-5 h-5 mr-2" /> ลบประกาศนี้
                                        </Button>
                                    )}
                                </div>

                                {/* Inquiry Form */}
                                <div className="mt-8 pt-8 border-t border-slate-100">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <MessageSquare className="w-5 h-5 text-emerald-500" />
                                        ส่งข้อความสอบถาม
                                    </h3>
                                    <div className="space-y-4">
                                        <textarea 
                                            placeholder="สนใจทรัพย์นี้ครับ นัดดูได้วันไหนบ้าง?" 
                                            value={inquiryMessage}
                                            onChange={(e) => setInquiryMessage(e.target.value)}
                                            className="w-full min-h-[120px] p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none transition-all resize-none text-sm"
                                        />
                                        <Button 
                                            onClick={handleSendInquiry}
                                            disabled={isSendingInquiry}
                                            className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold transition-all hover:bg-black disabled:opacity-50"
                                        >
                                            {isSendingInquiry ? <Loader2 className="w-5 h-5 animate-spin" /> : 'ส่งข้อความ'}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Modal for Room Booking & Editing */}
                {selectedUnit && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                            {/* Header */}
                            <div className="relative h-36 bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
                                <button onClick={() => setSelectedUnit(null)} className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/20 p-2 rounded-full hover:bg-black/40 transition-all z-10">
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="text-center">
                                    <h3 className="text-white text-sm font-medium opacity-80 mb-1">รายละเอียด</h3>
                                    <h2 className="text-white text-4xl font-black tracking-tight">ห้อง {selectedUnit.room_number}</h2>
                                    <p className="text-white/60 text-xs mt-1">ชั้น {selectedUnit.floor_number}</p>
                                </div>
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                            </div>

                            {/* Content */}
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                                    <div>
                                        <p className="text-sm text-slate-500 mb-1 font-medium">สถานะห้อง</p>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full 
                                                ${selectedUnit.status === 'AVAILABLE' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : ''}
                                                ${selectedUnit.status === 'BOOKED' ? 'bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.5)]' : ''}
                                                ${selectedUnit.status === 'SOLD' ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)]' : ''}
                                            `}></div>
                                            <span className={`font-bold text-lg
                                                ${selectedUnit.status === 'AVAILABLE' ? 'text-emerald-700' : ''}
                                                ${selectedUnit.status === 'BOOKED' ? 'text-yellow-700' : ''}
                                                ${selectedUnit.status === 'SOLD' ? 'text-rose-700' : ''}
                                            `}>
                                                {selectedUnit.status === 'AVAILABLE' ? 'ว่าง (Available)' : selectedUnit.status === 'BOOKED' ? 'จองแล้ว (Booked)' : 'ขายแล้ว (Sold)'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-slate-500 mb-1 font-medium">ราคาห้องนี้</p>
                                        <p className="font-black text-2xl text-slate-900 tracking-tight">฿{selectedUnit.price?.toLocaleString() || property?.price?.toLocaleString() || 0}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">พื้นที่ห้อง</p>
                                        <p className="font-bold text-slate-700">{selectedUnit.size || property?.size || '0'} ตร.ม.</p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">สิ่งอำนวยความสะดวก</p>
                                        <div className="flex flex-wrap gap-1">
                                            {selectedUnit.features ? selectedUnit.features.split(',').map((f: string, i: number) => (
                                                <span key={i} className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded-md text-slate-600 font-medium">{f.trim()}</span>
                                            )) : <span className="text-[10px] text-slate-400 italic">ไม่มีระบุ</span>}
                                        </div>
                                    </div>
                                </div>

                                {/* Internal Layout - only for ROOM type */}
                                {selectedUnit.unit_type === 'ROOM' && (
                                    <div className="bg-slate-50 rounded-2xl p-5 mb-8 border border-slate-100 shadow-inner group">
                                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-4 text-center tracking-widest">ผังภายในห้อง</p>
                                        <div className="w-full h-48 relative overflow-hidden transition-all duration-500 group-hover:scale-[1.02]">
                                            {renderRoomLayout(selectedUnit)}
                                        </div>
                                        <div className="mt-4 flex items-center justify-center gap-4">
                                            <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Bed</div>
                                            <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Bath</div>
                                            <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase"><div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div> Kitchen</div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Controls - Booking only for ROOM type */}
                                <div>
                                    {selectedUnit.unit_type === 'ROOM' ? (
                                        <>
                                            <Button 
                                                disabled={selectedUnit.status !== 'AVAILABLE'} 
                                                onClick={() => handleBookUnit(selectedUnit.id)}
                                                className={`w-full h-14 text-lg font-bold rounded-xl transition-all 
                                                    ${selectedUnit.status === 'AVAILABLE' ? 'bg-slate-900 hover:bg-black text-white shadow-xl shadow-slate-900/20 hover:-translate-y-1' : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'}
                                                `}
                                            >
                                                {selectedUnit.status === 'AVAILABLE' ? (
                                                    <div className="flex items-center justify-center">
                                                        <CheckCircle className="w-5 h-5 mr-2" /> จองห้องนี้เลย
                                                    </div>
                                                ) : 'ห้องนี้ถูกจองไปแล้ว'}
                                            </Button>
                                            {selectedUnit.status === 'AVAILABLE' && <p className="text-xs text-center text-slate-400 mt-4">* Demo: ห้องจะถูกเปลี่ยนสถานะเป็นจองแล้วทันทีเมื่อกดปุ่ม</p>}
                                        </>
                                    ) : (
                                        <div className="text-center py-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <p className="text-sm text-slate-500 font-medium">
                                                {selectedUnit.unit_type === 'LIFT' ? '🛗 ลิฟต์โดยสาร' : 
                                                 selectedUnit.unit_type === 'EXIT' ? '🚪 ทางออกฉุกเฉิน' : 
                                                 selectedUnit.unit_type === 'HALLWAY' ? '🚶 ทางเดิน' :
                                                 `📍 ${selectedUnit.room_number}`}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1">พื้นที่ส่วนกลาง - ไม่สามารถจองได้</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}