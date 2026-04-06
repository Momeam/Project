import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { Home, MapPin, Sofa, Plus, XCircle, LayoutGrid, Upload, Image as ImageIcon } from 'lucide-react';
import { Property } from '@/lib/types';
import { Button } from "@/components/ui/button";
import FloorPlanBuilder from './FloorPlanBuilder';
import HousePlanBuilder from './HousePlanBuilder';
import CondoRoomEditor from './CondoRoomEditor';

type FormDataState = {
    title: string;
    price: number;
    type: 'SALE' | 'RENT';
    category: 'HOUSE' | 'CONDO' | 'LAND';
    bedrooms: number;
    bathrooms: number;
    size: number;
    address: string;
    province: string;
    description: string;
    images: File[];
    isProject: boolean;
    totalFloors: number;
    roomsPerFloor: number;
    houseFloors: number;
};

interface AddListingFormProps {
    isEdit?: boolean;
    property?: Property;
}

export default function AddListingForm({ isEdit = false, property }: AddListingFormProps) {
    const router = useRouter();
    const user = useAuthStore((state) => state.currentUser);
    const sellerType = (user as any)?.seller_type || 'OWNER';

    const [formData, setFormData] = useState<FormDataState>({
        title: property?.title || '',
        price: property?.price || 0,
        type: property?.type || 'SALE',
        category: property?.category || 'HOUSE',
        bedrooms: property?.bedrooms || 0,
        bathrooms: property?.bathrooms || 0,
        size: property?.size || 0,
        address: property?.address || '',
        province: property?.province || 'กรุงเทพมหานคร',
        description: property?.description || '',
        images: [],
        isProject: property?.is_project || false,
        totalFloors: property?.total_floors || property?.totalFloors || 1,
        roomsPerFloor: property?.rooms_per_floor || property?.roomsPerFloor || 1,
        houseFloors: property?.house_floors || 1,
    });

    const [isLoading, setIsLoading] = useState(false);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [showBuilder, setShowBuilder] = useState(false);
    const [showHouseBuilder, setShowHouseBuilder] = useState(false);
    const [showCondoEditor, setShowCondoEditor] = useState(false);
    const [units, setUnits] = useState<any[]>([]);
    const [houseLayout, setHouseLayout] = useState<any>(property?.house_layout || null);
    const [condoLayout, setCondoLayout] = useState<any>(property?.house_layout?.components ? property.house_layout : null);

    // Blueprint images for agents
    const [blueprintFiles, setBlueprintFiles] = useState<File[]>([]);
    const [blueprintPreviews, setBlueprintPreviews] = useState<string[]>(property?.blueprint_images || []);

    // Role-based flags
    const isDeveloper = sellerType === 'DEVELOPER';
    const isAgent = sellerType === 'AGENT';
    const isOwner = sellerType === 'OWNER';
    const isHouse = formData.category === 'HOUSE';
    const isCondo = formData.category === 'CONDO';

    useEffect(() => {
        if (isEdit && property?.id) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL || `/api`}/properties/${property.id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.units) setUnits(data.units);
                    if (data.house_layout) setHouseLayout(data.house_layout);
                    if (data.blueprint_images) setBlueprintPreviews(data.blueprint_images);
                    if (data.total_floors || data.rooms_per_floor) {
                        setFormData(prev => ({
                            ...prev,
                            isProject: data.is_project || prev.isProject,
                            totalFloors: data.total_floors || prev.totalFloors,
                            roomsPerFloor: data.rooms_per_floor || prev.roomsPerFloor,
                            houseFloors: data.house_floors || prev.houseFloors,
                        }));
                    }
                });
        }
    }, [isEdit, property]);

    const LocationPicker = useMemo(() => dynamic(
        () => import('@/components/LocationPicker'),
        { 
            ssr: false, 
            loading: () => <div className="h-[300px] w-full bg-gray-100 animate-pulse flex items-center justify-center text-gray-500">กำลังโหลดแผนที่เลือกพิกัด...</div> 
        }
    ), []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setImagePreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const handleBlueprintChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setBlueprintFiles(prev => [...prev, ...files]);
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setBlueprintPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const data = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            if (key === 'images') {
                (value as File[]).forEach(file => data.append('images', file));
            } else {
                data.append(key, String(value));
            }
        });

        if (user) data.append('userId', String(user.id));
        if (houseLayout) data.append('houseLayout', JSON.stringify(houseLayout));
        if (condoLayout) data.append('houseLayout', JSON.stringify(condoLayout));

        // Blueprint images: upload as regular images then store URLs
        // For now, store as separate field
        if (blueprintFiles.length > 0) {
            blueprintFiles.forEach(file => data.append('images', file));
        }

        try {
            const url = isEdit ? `${process.env.NEXT_PUBLIC_API_URL || `/api`}/properties/${property?.id}` : `/api/properties`;
            const method = isEdit ? 'PUT' : 'POST';
            
            const res = await fetch(url, {
                method,
                body: data,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (res.ok) {
                alert(isEdit ? 'แก้ไขประกาศสำเร็จ!' : 'ลงประกาศสำเร็จ!');
                router.push('/my-properties');
            } else {
                const errData = await res.json();
                alert('เกิดข้อผิดพลาด: ' + (errData.error || 'ไม่สามารถบันทึกข้อมูลได้'));
            }
        } catch (error) {
            console.error('Submit error:', error);
            alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
        } finally {
            setIsLoading(false);
        }
    };

    // Seller type badge
    const sellerBadge = isDeveloper ? { label: 'เจ้าของโครงการ', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' }
        : isAgent ? { label: 'นายหน้า', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' }
        : { label: 'เจ้าของห้อง/บ้าน', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 max-w-4xl mx-auto mb-20 animate-in fade-in slide-in-from-bottom-8 duration-500">
            
            {/* Seller Type Badge */}
            <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${sellerBadge.color}`}>
                    {sellerBadge.label}
                </span>
                <span className="text-xs text-gray-400">
                    {isDeveloper && 'สามารถสร้างโครงการและจัดผังตึกทั้งหมดได้'}
                    {isAgent && 'อัปโหลดรูปแบบแปลนต้นฉบับเท่านั้น (ไม่สามารถสร้างแปลนเอง)'}
                    {isOwner && 'สามารถสร้างแปลนห้อง/บ้านได้ด้วยตัวเอง'}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Side: Basic Info */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                            <Home className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-xl font-bold dark:text-white">ข้อมูลเบื้องต้น</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">ชื่อประกาศ</label>
                            <input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-green-500 outline-none transition-all" placeholder="เช่น คอนโดหรูใจกลางสุขุมวิท" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">ประเภท</label>
                                <select name="type" value={formData.type} onChange={handleChange} className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600">
                                    <option value="SALE">ขาย</option>
                                    <option value="RENT">เช่า</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">หมวดหมู่</label>
                                <select name="category" value={formData.category} onChange={handleChange} className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600">
                                    <option value="HOUSE">บ้าน</option>
                                    <option value="CONDO">คอนโด</option>
                                    <option value="LAND">ที่ดิน</option>
                                </select>
                            </div>
                        </div>

                        {/* === DEVELOPER ONLY: Project Mode === */}
                        {isDeveloper && isCondo && (
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">ประกาศแบบโครงการ (Is Project?)</label>
                                <div className="flex items-center gap-4 p-4 bg-violet-50 dark:bg-violet-900/30 rounded-xl border border-violet-100 dark:border-violet-800">
                                    <input 
                                        type="checkbox" 
                                        name="isProject" 
                                        checked={formData.isProject} 
                                        onChange={(e) => setFormData(prev => ({ ...prev, isProject: e.target.checked }))}
                                        className="w-5 h-5 accent-violet-600 rounded cursor-pointer"
                                    />
                                    <span className="text-sm font-bold text-violet-800 dark:text-violet-300">เป็นโครงการ (ต้องการสร้างผังตึกทั้งหมด)</span>
                                </div>

                                {formData.isProject && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 mt-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">จำนวนชั้น</label>
                                                <input type="number" name="totalFloors" value={formData.totalFloors} onChange={handleChange} className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600" min={1} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">ห้องต่อชั้น</label>
                                                <input type="number" name="roomsPerFloor" value={formData.roomsPerFloor} onChange={handleChange} className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600" min={1} />
                                            </div>
                                        </div>

                                        {isEdit && (
                                            <div className="pt-2">
                                                <Button 
                                                    type="button"
                                                    onClick={() => setShowBuilder(true)}
                                                    className="w-full bg-slate-900 hover:bg-black text-white h-12 rounded-xl font-bold flex items-center justify-center gap-2"
                                                >
                                                    <LayoutGrid className="w-5 h-5" />
                                                    จัดการผังโครงการและห้องพัก (Manage Floor Plan)
                                                </Button>
                                            </div>
                                        )}

                                        {!isEdit && (
                                            <div className="text-sm text-violet-600 dark:text-violet-400">
                                                * ระบบจะสร้างผังห้องอัตโนมัติ คุณสามารถจัดการผังได้หลังจากสร้างโครงการ
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* === OWNER: House Plan Builder === */}
                        {isOwner && isHouse && (
                            <div className="space-y-3">
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">แปลนบ้าน</label>
                                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Home className="w-5 h-5 text-amber-600" />
                                        <span className="text-sm font-bold text-amber-800 dark:text-amber-300">ออกแบบแปลนบ้านของคุณ</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div>
                                            <label className="block text-xs font-medium mb-1 dark:text-gray-400">จำนวนชั้นบ้าน</label>
                                            <select name="houseFloors" value={formData.houseFloors} onChange={handleChange} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 text-sm">
                                                <option value={1}>1 ชั้น</option>
                                                <option value={2}>2 ชั้น</option>
                                                <option value={3}>3 ชั้น</option>
                                            </select>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={() => setShowHouseBuilder(true)}
                                        className="w-full bg-amber-600 hover:bg-amber-700 text-white h-10 rounded-xl font-bold flex items-center justify-center gap-2 text-sm"
                                    >
                                        <LayoutGrid className="w-4 h-4" />
                                        {houseLayout ? 'แก้ไขแปลนบ้าน' : 'เริ่มออกแบบแปลนบ้าน'}
                                    </Button>
                                    {houseLayout && (
                                        <p className="text-xs text-emerald-600 mt-2 font-bold">✅ มีแปลนบ้านแล้ว ({houseLayout.floors?.length || 0} ชั้น)</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* === AGENT: Blueprint Upload === */}
                        {isAgent && (
                            <div className="space-y-3">
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                                    อัปโหลดรูปแบบแปลนต้นฉบับ {isCondo ? '(ผังห้องคอนโด)' : '(แปลนบ้าน)'}
                                </label>
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Upload className="w-5 h-5 text-blue-600" />
                                        <span className="text-sm font-bold text-blue-800 dark:text-blue-300">อัปโหลดรูปแปลนจากเจ้าของ/นิติ</span>
                                    </div>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">
                                        * นายหน้าไม่สามารถสร้างแปลนเองได้ กรุณาอัปโหลดรูปแบบแปลนต้นฉบับที่ได้รับมา
                                    </p>
                                    <div className="border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg p-4 text-center">
                                        <ImageIcon className="mx-auto h-8 w-8 text-blue-400 mb-2" />
                                        <label className="cursor-pointer">
                                            <span className="text-sm font-medium text-blue-600 hover:text-blue-500">เลือกรูปแปลน</span>
                                            <input type="file" multiple onChange={handleBlueprintChange} className="sr-only" accept="image/*" />
                                        </label>
                                    </div>
                                    {blueprintPreviews.length > 0 && (
                                        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                                            {blueprintPreviews.map((src, i) => (
                                                <div key={i} className="relative flex-shrink-0">
                                                    <img src={src} alt={`แปลน ${i+1}`} className="w-20 h-20 object-cover rounded-lg border" />
                                                    <button type="button" onClick={() => {
                                                        setBlueprintPreviews(prev => prev.filter((_, idx) => idx !== i));
                                                        setBlueprintFiles(prev => prev.filter((_, idx) => idx !== i));
                                                    }} className="absolute -top-1 -right-1 bg-red-500 text-white p-0.5 rounded-full">
                                                        <XCircle size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* === OWNER + CONDO: Single Room Layout === */}
                        {isOwner && isCondo && (
                            <div className="space-y-3">
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">ผังห้องคอนโด</label>
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                                    <div className="flex items-center gap-2 mb-2">
                                        <LayoutGrid className="w-5 h-5 text-emerald-600" />
                                        <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">ออกแบบผังห้องคอนโดของคุณ</span>
                                    </div>
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-3">
                                        วางตำแหน่ง ห้องนอน, ห้องน้ำ, ครัว, ระเบียง ฯลฯ ลงในผังห้องคอนโด พร้อมเลือกทิศทางประตูและหน้าต่าง
                                    </p>
                                    <Button
                                        type="button"
                                        onClick={() => setShowCondoEditor(true)}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-10 rounded-xl font-bold text-sm"
                                    >
                                        <LayoutGrid className="w-4 h-4 mr-2" /> {condoLayout ? 'แก้ไขผังห้องคอนโด' : 'เริ่มออกแบบผังห้องคอนโด'}
                                    </Button>
                                    {condoLayout && (
                                        <p className="text-xs text-emerald-600 mt-2 font-bold">✅ มีผังห้องแล้ว ({condoLayout.components?.length || 0} ส่วน)</p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">ราคา (บาท)</label>
                            <input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600" placeholder="0.00" />
                        </div>
                    </div>
                </div>

                {/* Right Side: Features & Media */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <Sofa className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-xl font-bold dark:text-white">จุดเด่นและสื่อ</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">ห้องนอน</label>
                            <input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleChange} className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600" min={0} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">ห้องน้ำ</label>
                            <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600" min={0} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">ขนาดพื้นที่ (ตร.ม.)</label>
                        <input type="number" name="size" value={formData.size} onChange={handleChange} className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600" min={0} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">รูปภาพประกอบ</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg dark:border-gray-600">
                            <div className="space-y-1 text-center">
                                <Plus className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="flex text-sm text-gray-600">
                                    <label className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-green-600 hover:text-green-500">
                                        <span>อัปโหลดรูปภาพ</span>
                                        <input type="file" multiple onChange={handleImageChange} className="sr-only" accept="image/*" />
                                    </label>
                                </div>
                                <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                            </div>
                        </div>
                        {imagePreviews.length > 0 && (
                            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                                {imagePreviews.map((src, i) => (
                                    <div key={i} className="relative w-2 object-cover rounded-md overflow-hidden border">
                                        <img src={src} alt="preview" className="w-20 h-20 object-cover" />
                                        <button type="button" onClick={() => {
                                            setImagePreviews(prev => prev.filter((_, idx) => idx !== i));
                                            setFormData(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }));
                                        }} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-full"><XCircle size={14}/></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-4 pt-6 border-t dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                        <MapPin className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h2 className="text-xl font-bold dark:text-white">ที่ตั้งและพิกัด</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">ที่อยู่ / ทำเล</label>
                        <input type="text" name="address" value={formData.address} onChange={handleChange} required className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">จังหวัด</label>
                        <select name="province" value={formData.province} onChange={handleChange} className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600">
                            {['กรุงเทพมหานคร', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ', 'ชลบุรี', 'ภูเก็ต', 'เชียงใหม่'].map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="h-[300px] rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                    <LocationPicker onLocationSelect={() => {}} />
                </div>
            </div>

            <div className="pt-6 border-t dark:border-gray-700">
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">รายละเอียดเพิ่มเติม</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={5} className="w-full p-4 border rounded-xl dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-green-500 outline-none transition-all" placeholder="บรรยายความโดดเด่นของทรัพย์นี้ให้ลูกค้าประทับใจ..."></textarea>
            </div>

            <button type="submit" disabled={isLoading} className="w-full flex justify-center py-4 px-4 border border-transparent rounded-lg shadow-sm text-lg font-bold text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 transition-all">
                {isLoading ? 'กำลังบันทึกลง Database...' : (isEdit ? 'บันทึกการแก้ไข' : 'ลงประกาศเข้าฐานข้อมูลจริง!')}
            </button>

            {/* FloorPlanBuilder (DEVELOPER project mode OR OWNER condo) */}
            {showBuilder && property && (
                <FloorPlanBuilder 
                    propertyId={Number(property.id)} 
                    existingUnits={units} 
                    totalFloors={formData.totalFloors}
                    onSaveSuccess={() => { setShowBuilder(false); window.location.reload(); }}
                    onClose={() => setShowBuilder(false)}
                />
            )}

            {/* HousePlanBuilder (OWNER house only) */}
            {showHouseBuilder && (
                <HousePlanBuilder
                    initialLayout={houseLayout}
                    houseFloors={formData.houseFloors}
                    onSave={(layout) => {
                        setHouseLayout(layout);
                        setShowHouseBuilder(false);
                        alert('บันทึกแปลนบ้านสำเร็จ! 🏠');
                    }}
                    onClose={() => setShowHouseBuilder(false)}
                />
            )}

            {/* CondoRoomEditor (OWNER condo only) */}
            {showCondoEditor && (
                <CondoRoomEditor
                    initialLayout={condoLayout}
                    onSave={(layout) => {
                        setCondoLayout(layout);
                        setShowCondoEditor(false);
                        alert('บันทึกผังห้องคอนโดสำเร็จ! 🏢');
                    }}
                    onClose={() => setShowCondoEditor(false)}
                />
            )}
        </form>
    );
}