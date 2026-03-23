'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { createListing } from '@/actions/listings';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { usePropertyStore } from '@/stores/usePropertyStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Home, MapPin, FileText, Key, Car, Sofa, Calendar, AlignLeft } from 'lucide-react';

// Type สำหรับ State ในฟอร์ม
type FormDataState = {
    title: string; price: number; type: 'SALE' | 'RENT'; category: 'HOUSE' | 'CONDO' | 'LAND'; 
    address: string;
    description: string;
    bedrooms: number; bathrooms: number; size: number;
    floor: number; yearBuilt: number; parking: number; landSize: number;
    furniture: 'NONE' | 'PARTLY' | 'FULLY';
    nearbyTransport: string;
    deposit: number; minContract: number;
    
    images: File[]; latitude?: number; longitude?: number;
    commonFacilities: { pool: boolean; fitness: boolean; parking: boolean; };
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 transition-all">
            {pending ? 'กำลังบันทึกข้อมูลลงฐานข้อมูล...' : 'ลงประกาศทันที'}
        </button>
    );
}

export default function AddListingForm() {
    const formRef = useRef<HTMLFormElement>(null);
    
    // ⭐️ ดึงฟังก์ชันมาจาก Zustand Store
    const addProperty = usePropertyStore((state) => state.addProperty);
    const fetchProperties = usePropertyStore((state) => state.fetchProperties); // 👈 เพิ่มฟังก์ชันดูดข้อมูลใหม่
    
    const userId = useAuthStore((state) => state.userId);

    const [formData, setFormData] = useState<FormDataState>({
        title: '', price: 0, type: 'SALE', category: 'CONDO', 
        address: '', description: '', 
        bedrooms: 1, bathrooms: 1, size: 0,
        floor: 0, yearBuilt: new Date().getFullYear(), parking: 1, landSize: 0,
        furniture: 'PARTLY', nearbyTransport: '',
        deposit: 2, minContract: 12,
        
        images: [], latitude: undefined, longitude: undefined,
        commonFacilities: { pool: false, fitness: false, parking: false },
    });
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

    const initialState = { success: false, message: '', newProperty: undefined };
    const [state, formAction] = useActionState(createListing, initialState);

    const LocationPicker = useMemo(() => dynamic(
        () => import('@/components/LocationPicker'),
        { ssr: false, loading: () => <div className="h-[300px] w-full bg-gray-100 flex items-center justify-center text-gray-500">กำลังโหลดแผนที่...</div> }
    ), []);

    // ⭐️ เมื่อ Action ฝั่ง Server ทำงานเสร็จ
    useEffect(() => {
        if (state.success) {
            // เพิ่มเข้า State ชั่วคราวไปก่อนเพื่อให้ UI ตอบสนองไว (Optimistic UI)
            if (state.newProperty) addProperty(state.newProperty);
            
            // 🚀 สั่งให้วิ่งไปดูดข้อมูลจริงจาก SQL Server มาอัปเดตทับอีกรอบเพื่อความชัวร์!
            fetchProperties(); 
            
            // ล้างฟอร์ม
            formRef.current?.reset();
            setImagePreviews([]);
            alert("🎉 ลงประกาศลงฐานข้อมูล SQL Server เรียบร้อยแล้ว!");
        }
    }, [state, addProperty, fetchProperties]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
    };

    const handleTagChange = (field: keyof FormDataState, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };
    
   const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            // ⭐️ เปลี่ยนมาใช้วิธีวนลูปแบบดั้งเดิม (ชัวร์ 100% ไม่มี Error)
            const filesArray: File[] = [];
            for (let i = 0; i < e.target.files.length; i++) {
                filesArray.push(e.target.files[i]);
            }
            
            // นำ Array ที่ได้ไปใช้งานต่อ
            setFormData(prev => ({ ...prev, images: filesArray }));
            const newPreviews = filesArray.map(file => URL.createObjectURL(file));
            setImagePreviews(newPreviews);
        }
    };
    
    const handleLocationSelect = (lat: number, lng: number) => setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));

    return (
        <form ref={formRef} action={formAction} className="space-y-8 p-6 bg-white dark:bg-gray-800 shadow-lg rounded-xl max-w-4xl mx-auto text-black">
            <input type="hidden" name="userId" value={userId || ''} />
            
            <div className="border-b pb-4">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">ลงประกาศอสังหาริมทรัพย์</h2>
                <p className="text-gray-500 mt-1">กรอกข้อมูลให้ครบถ้วนเพื่อดึงดูดความสนใจของผู้ซื้อ</p>
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
                        <input type="hidden" name="type" value={formData.type} />
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

                    {formData.category !== 'CONDO' && (
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">ขนาดที่ดิน (ตร.วา)</label>
                            <input type="number" name="landSize" value={formData.landSize} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600" />
                        </div>
                    )}

                    {formData.category === 'CONDO' && (
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">ชั้นที่</label>
                            <input type="number" name="floor" value={formData.floor} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600" />
                        </div>
                    )}

                    <div>
                         <label className="block text-sm font-medium mb-1 dark:text-gray-300">ปีที่สร้างเสร็จ (ค.ศ.)</label>
                         <input type="number" name="yearBuilt" value={formData.yearBuilt} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 flex items-center gap-1 dark:text-gray-300"><Sofa className="w-4 h-4"/> การตกแต่ง</label>
                        <select name="furniture" value={formData.furniture} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600">
                            <option value="NONE">ห้องเปล่า (No Furniture)</option>
                            <option value="PARTLY">บางส่วน (Partly Furnished)</option>
                            <option value="FULLY">ตกแต่งครบ (Fully Furnished)</option>
                        </select>
                    </div>
                    <div>
                         <label className="block text-sm font-medium mb-1 flex items-center gap-1 dark:text-gray-300"><Car className="w-4 h-4"/> ที่จอดรถ (คัน)</label>
                         <input type="number" name="parking" value={formData.parking} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600" />
                    </div>
                </div>
            </section>

            {/* กลุ่มที่ 3: เงื่อนไขการเช่า */}
            {formData.type === 'RENT' && (
                <section className="space-y-4 pt-4 border-t border-blue-200 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
                    <div className="flex items-center gap-2 text-lg font-semibold text-blue-700 dark:text-blue-400"><Key className="w-5 h-5" /> เงื่อนไขการเช่า</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">ค่ามัดจำ (เดือน)</label>
                            <input type="number" name="deposit" value={formData.deposit} onChange={handleChange} className="w-full p-2 border rounded-md border-blue-200 dark:bg-gray-700 dark:text-white dark:border-gray-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 flex items-center gap-1 dark:text-gray-300"><Calendar className="w-4 h-4"/> สัญญาขั้นต่ำ (เดือน)</label>
                            <input type="number" name="minContract" value={formData.minContract} onChange={handleChange} className="w-full p-2 border rounded-md border-blue-200 dark:bg-gray-700 dark:text-white dark:border-gray-600" />
                        </div>
                    </div>
                </section>
            )}

            {/* กลุ่มที่ 4: ทำเลที่ตั้ง */}
            <section className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-lg font-semibold text-blue-600"><MapPin className="w-5 h-5" /> ทำเลที่ตั้ง</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">ที่อยู่ / เลขที่บ้าน</label>
                        <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600" placeholder="บ้านเลขที่, ซอย, ถนน..." />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">การเดินทาง / สถานที่ใกล้เคียง</label>
                        <input type="text" name="nearbyTransport" value={formData.nearbyTransport} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600" placeholder="เช่น ใกล้ BTS อโศก 500 ม." />
                    </div>
                </div>
                <div className="w-full h-80 rounded-lg border border-gray-300 overflow-hidden mt-2 dark:border-gray-600">
                    <LocationPicker onLocationSelect={handleLocationSelect} />
                </div>
                <input type="hidden" name="latitude" value={formData.latitude ?? ''} />
                <input type="hidden" name="longitude" value={formData.longitude ?? ''} />
            </section>

            {/* กลุ่มที่ 5: รูปภาพ */}
            <section className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <label className="block text-lg font-semibold text-blue-600">รูปภาพประกอบ</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer relative dark:border-gray-600">
                    <input type="file" name="images" onChange={handleImageChange} multiple accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <p className="text-gray-500 dark:text-gray-400">คลิกเพื่อเลือกรูปภาพ หรือลากไฟล์มาวางที่นี่</p>
                    <p className="text-xs text-gray-400 mt-1">(รองรับ JPG, PNG แนะนำให้ใส่หลายรูป)</p>
                </div>
                {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-2">
                        {imagePreviews.map((url, index) => (
                            <div key={index} className="aspect-square relative rounded-md overflow-hidden border dark:border-gray-600">
                                <img src={url} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {state.message && (
                <div className={`p-4 rounded-md text-sm font-medium ${state.success ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                    {state.message}
                </div>
            )}
            
            <SubmitButton />
        </form>
    );
}