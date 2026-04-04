import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { Home, MapPin, FileText, Key, Car, Sofa, Calendar, AlignLeft, Plus, XCircle, LayoutGrid } from 'lucide-react';
import { Property } from '@/lib/types';
import { Button } from "@/components/ui/button";
import FloorPlanBuilder from './FloorPlanBuilder';

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
};

interface AddListingFormProps {
    isEdit?: boolean;
    property?: Property;
}

export default function AddListingForm({ isEdit = false, property }: AddListingFormProps) {
    const router = useRouter();
    const user = useAuthStore((state) => state.currentUser);

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
        totalFloors: property?.totalFloors || 1,
        roomsPerFloor: property?.roomsPerFloor || 1,
    });

    const [isLoading, setIsLoading] = useState(false);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [showBuilder, setShowBuilder] = useState(false);
    const [units, setUnits] = useState<any[]>([]);

    useEffect(() => {
        if (isEdit && property?.id) {
            fetch(`http://localhost:5000/api/properties/${property.id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.units) setUnits(data.units);
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

        try {
            const url = isEdit ? `http://localhost:5000/api/properties/${property?.id}` : 'http://localhost:5000/api/properties';
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

    return (
        <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 max-w-4xl mx-auto mb-20 animate-in fade-in slide-in-from-bottom-8 duration-500">
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

                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">ประกาศแบบโครงการ (Is Project?)</label>
                            <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-100 dark:border-blue-800">
                                <input 
                                    type="checkbox" 
                                    name="isProject" 
                                    checked={formData.isProject} 
                                    onChange={(e) => setFormData(prev => ({ ...prev, isProject: e.target.checked }))}
                                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                                />
                                <span className="text-sm font-bold text-blue-800 dark:text-blue-300">เป็นโครงการ (ต้องการสร้างผังห้อง Interactive)</span>
                            </div>

                            {formData.isProject && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 mt-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">จำนวนชั้น (Floors)</label>
                                            <input type="number" name="totalFloors" value={formData.totalFloors} onChange={handleChange} className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600" min={1} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">ห้องต่อชั้น (Rooms per Floor)</label>
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
                                            <p className="text-[10px] text-slate-500 mt-2 text-center">
                                                * คุณสามารถจัดวางตำแหน่งห้องบนผังแต่ละชั้น และออกแบบผังภายในห้องแต่ละประเภทได้ที่นี่
                                            </p>
                                        </div>
                                    )}

                                    {!isEdit && (
                                        <div className="text-sm text-blue-600 dark:text-blue-400">
                                            * ระบบจะสร้างผังห้องอัตโนมัติ (เช่น ชั้น 1 จะมี 101, 102...) คุณสามารถจัดการสถานะห้องได้หลังจากสร้างโครงการเสร็จ
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

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

            {showBuilder && property && (
                <FloorPlanBuilder 
                    propertyId={Number(property.id)} 
                    existingUnits={units} 
                    totalFloors={formData.totalFloors}
                    onSaveSuccess={() => { setShowBuilder(false); window.location.reload(); }}
                    onClose={() => setShowBuilder(false)}
                />
            )}
        </form>
    );
}