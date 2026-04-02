'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { Home, MapPin, FileText, Key, Car, Sofa, Calendar, AlignLeft, Plus, XCircle } from 'lucide-react';
import { Property } from '@/lib/types';

type FormDataState = {
    title: string; price: number; type: 'SALE' | 'RENT'; category: 'HOUSE' | 'CONDO' | 'LAND'; 
    address: string;
    description: string; interiorDetails: string;
    bedrooms: number; bathrooms: number; size: number;
    floor: number; yearBuilt: number; parking: number; landSize: number;
    furniture: 'NONE' | 'PARTLY' | 'FULLY';
    nearbyTransport: string;
    deposit: number; minContract: number;
    status: 'ACTIVE' | 'DRAFT' | 'INACTIVE' | 'PENDING' | 'SOLD' | 'BOOKED';
    images: File[]; latitude?: number; longitude?: number;
    commonFacilities: { pool: boolean; fitness: boolean; parking: boolean; };
};

interface AddListingFormProps {
    property?: Property;
    isEdit?: boolean;
}

export default function AddListingForm({ property, isEdit = false }: AddListingFormProps) {
    const router = useRouter();
    // 🟢 ดึงข้อมูลผู้ใช้จาก Store ของจริง
    const currentUser = useAuthStore((state) => state.user); 
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState<FormDataState>({
        title: property?.title || '', 
        price: property?.price || 0, 
        type: property?.type || 'SALE', 
        category: property?.category || 'CONDO', 
        address: property?.address || '', 
        description: property?.description || '', 
        interiorDetails: property?.interiorDetails || '',
        bedrooms: property?.bedrooms || 1, 
        bathrooms: property?.bathrooms || 1, 
        size: property?.size || 0,
        floor: property?.floors || 0, 
        yearBuilt: property?.yearBuilt || new Date().getFullYear(), 
        parking: property?.parking || 1, 
        landSize: property?.landSize || 0,
        furniture: property?.furniture || 'PARTLY', 
        nearbyTransport: property?.nearbyTransport || '',
        deposit: property?.deposit || 2, 
        minContract: property?.minContract || 12,
        status: property?.status || 'ACTIVE',
        images: [], 
        latitude: property?.latitude, 
        longitude: property?.longitude,
        commonFacilities: { pool: false, fitness: false, parking: false },
    });

    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

    const LocationPicker = useMemo(() => dynamic(
        () => import('@/components/LocationPicker'),
        { ssr: false, loading: () => <div className="h-[300px] w-full bg-gray-100 flex items-center justify-center text-gray-500">กำลังโหลดแผนที่...</div> }
    ), []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
    };

    const handleTagChange = (field: keyof FormDataState, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray: File[] = [];
            for (let i = 0; i < e.target.files.length; i++) {
                filesArray.push(e.target.files[i]);
            }
            if (filesArray.length > 0) {
                setFormData(prev => ({ ...prev, images: [...prev.images, ...filesArray] }));
                const newPreviews = filesArray.map(file => URL.createObjectURL(file));
                setImagePreviews(prev => [...prev, ...newPreviews]);
            }
        }
    };
    
    const handleLocationSelect = (lat: number, lng: number) => setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));

    // 🟢 ฟังก์ชันส่งข้อมูลเข้า Database (พอร์ต 5000)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const payload = {
            ...formData,
            userId: currentUser?.id || '1', // ส่ง ID คนล็อกอินไปด้วย
            images: [], // ⚠️ ระบบหลังบ้านเรายังไม่รองรับไฟล์รูปภาพ เดี๋ยวเราค่อยมาทำระบบอัปโหลดทีหลังครับ ตอนนี้ส่งว่างไปก่อนเพื่อไม่ให้เซิร์ฟเวอร์พัง
        };

        try {
            const url = isEdit ? `http://localhost:5000/api/properties/${property?.id}` : 'http://localhost:5000/api/properties';
            const method = isEdit ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                alert(isEdit ? 'แก้ไขประกาศสำเร็จ! 🎉' : 'ลงประกาศสำเร็จลง Database จริงแล้ว! 🎉');
                router.push('/user/dashboard'); // เด้งกลับหน้าจัดการ
            } else {
                const errorData = await response.json();
                alert(`เกิดข้อผิดพลาด: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error submitting property:', error);
            alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ Database ได้');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 p-6 bg-white dark:bg-gray-800 shadow-lg rounded-xl max-w-4xl mx-auto text-black">
            
            <div className="border-b pb-4">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{isEdit ? 'แก้ไขประกาศ' : 'ลงประกาศอสังหาริมทรัพย์'}</h2>
                <p className="text-gray-500 mt-1">{isEdit ? 'แก้ไขข้อมูลประกาศของคุณให้เป็นปัจจุบัน' : 'กรอกข้อมูลให้ครบถ้วนเพื่อดึงดูดความสนใจของผู้ซื้อ'}</p>
            </div>

            {/* กลุ่มที่ 1: ข้อมูลหลัก */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-blue-600"><FileText className="w-5 h-5" /> ข้อมูลหลัก</div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">ชื่ออสังหาริมทรัพย์</label>
                        <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full p-2 border rounded-md text-lg font-semibold dark:bg-gray-700 dark:text-white dark:border-gray-600" required />
                    </div>
                    
                    <div className="col-span-2">
                        <label className="block text-sm font-medium mb-1 flex items-center gap-1 dark:text-gray-300">
                            <AlignLeft className="w-4 h-4"/> รายละเอียดประกาศ / จุดเด่น (Highlights)
                        </label>
                        <textarea 
                            name="description" 
                            value={formData.description} 
                            onChange={handleChange} 
                            rows={6} 
                            className="w-full p-3 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600" 
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">ประเภทประกาศ</label>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => handleTagChange('type', 'SALE')} className={`flex-1 py-2 rounded-md border ${formData.type === 'SALE' ? 'bg-green-600 text-white border-green-600' : 'bg-gray-50 text-gray-700 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'}`}>ขาย</button>
                            <button type="button" onClick={() => handleTagChange('type', 'RENT')} className={`flex-1 py-2 rounded-md border ${formData.type === 'RENT' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-700 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'}`}>เช่า</button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">ราคา {formData.type === 'RENT' ? '(บาท/เดือน)' : '(บาท)'}</label>
                        <input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600" required />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">หมวดหมู่</label>
                        <select name="category" value={formData.category} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600">
                            <option value="CONDO">คอนโดมิเนียม</option>
                            <option value="HOUSE">บ้านเดี่ยว / ทาวน์โฮม</option>
                            <option value="LAND">ที่ดิน</option>
                        </select>
                    </div>
                </div>
            </section>

            {/* กลุ่มที่ 2: รายละเอียดทรัพย์ */}
            <section className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-lg font-semibold text-blue-600"><Home className="w-5 h-5" /> รายละเอียดทรัพย์</div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.category !== 'LAND' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">ห้องนอน</label>
                                <input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">ห้องน้ำ</label>
                                <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600" />
                            </div>
                        </>
                    )}
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">พื้นที่ใช้สอย (ตร.ม.)</label>
                        <input type="number" name="size" value={formData.size} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600" />
                    </div>
                </div>
            </section>

            {/* กลุ่มที่ 4: ทำเลที่ตั้ง */}
            <section className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-lg font-semibold text-blue-600"><MapPin className="w-5 h-5" /> ทำเลที่ตั้ง</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">ที่อยู่ / ถนน</label>
                        <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600" placeholder="ซอย, ถนน..." />
                    </div>
                </div>
                <div className="w-full h-80 rounded-lg border border-gray-300 overflow-hidden mt-2 dark:border-gray-600">
                    <LocationPicker onLocationSelect={handleLocationSelect} />
                </div>
            </section>

            {/* กลุ่มที่ 5: รูปภาพ */}
            <section className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <label className="block text-lg font-bold text-blue-600 dark:text-blue-400">รูปภาพประกอบ</label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center bg-gray-50 dark:bg-gray-900/50 relative">
                    <input type="file" multiple accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="space-y-2">
                        <div className="mx-auto w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center"><Plus className="w-6 h-6 text-blue-600" /></div>
                        <p className="text-gray-600 font-medium">คลิกเพื่อเลือกรูปภาพ (เตรียมไว้สำหรับอัปเดตอนาคต)</p>
                    </div>
                </div>
            </section>

            <button type="submit" disabled={isLoading} className="w-full flex justify-center py-4 px-4 border border-transparent rounded-lg shadow-sm text-lg font-bold text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 transition-all">
                {isLoading ? 'กำลังบันทึกลง Database...' : (isEdit ? 'บันทึกการแก้ไข' : 'ลงประกาศเข้าฐานข้อมูลจริง!')}
            </button>
        </form>
    );
}