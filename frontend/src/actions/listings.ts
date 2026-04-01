'use server';

import { Property } from '@/stores/usePropertyStore';

type CreateListingState = {
    success: boolean;
    message: string;
    error?: string;
    newProperty?: Property;
};

export async function createListing(
    prevState: CreateListingState, 
    formData: FormData
): Promise<CreateListingState> {
    
    const id = formData.get('id') as string;
    const title = formData.get('title') as string;
    const price = parseFloat(formData.get('price') as string);
    const formUserId = formData.get('userId') as string;
    const userId = formUserId && formUserId !== '' ? formUserId : 'admin'; 

    const category = formData.get('category') as string;
    const type = formData.get('type') as string;
    const address = formData.get('address') as string;
    const description = formData.get('description') as string;
    const bedrooms = parseInt(formData.get('bedrooms') as string || '0');
    const bathrooms = parseInt(formData.get('bathrooms') as string || '0');
    const size = parseInt(formData.get('size') as string || '0');
    const interiorDetails = formData.get('interiorDetails') as string || '';
    const status = formData.get('status') as string || 'ACTIVE';

    if (!title || price <= 0) {
        return { success: false, message: "กรุณากรอกชื่อและราคาให้ถูกต้อง" };
    }

    const propertyData = {
        userId: userId,
        title: title,
        description: description || 'ไม่มีรายละเอียดเพิ่มเติม',
        type: type,
        category: category,
        price: price,
        address: address,
        province: 'กรุงเทพฯ', 
        bedrooms: bedrooms,
        bathrooms: bathrooms,
        size: size,
        interiorDetails: interiorDetails,
        status: status,
        imageUrls: [] as string[] // 👈 เพิ่มฟิลด์สำหรับเก็บ URL รูปภาพ
    };

    try {
        // 1. จัดการรูปภาพ (ถ้ามีการอัปโหลด)
        const imageFiles = formData.getAll('images') as File[];
        if (imageFiles.length > 0 && imageFiles[0].size > 0) {
            for (const file of imageFiles) {
                const imageFormData = new FormData();
                imageFormData.append('image', file);

                const uploadResponse = await fetch('http://127.0.0.1:5000/api/upload-single', {
                    method: 'POST',
                    body: imageFormData
                });

                if (uploadResponse.ok) {
                    const uploadData = await uploadResponse.json();
                    propertyData.imageUrls.push(uploadData.url);
                }
            }
        }

        const url = id ? `http://127.0.0.1:5000/api/properties/${id}` : 'http://127.0.0.1:5000/api/properties';
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(propertyData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'บันทึกไม่สำเร็จ');
        }

        return { 
            success: true, 
            message: id ? `แก้ไขประกาศ "${title}" เรียบร้อยแล้ว! 🏠✨` : `ลงประกาศ "${title}" เรียบร้อยแล้ว! 🏠✨`
        };

    } catch (error: any) {
        console.error("❌ Action Error:", error);
        return { success: false, message: `เกิดข้อผิดพลาด: ${error.message}` };
    }
}

export async function sendInquiry(
    propertyId: string, 
    receiverId: string, 
    message: string
) {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('กรุณาเข้าสู่ระบบเพื่อส่งข้อความ');

        const currentIP = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
        const response = await fetch(`http://${currentIP}:5000/api/inquiries`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ property_id: propertyId, receiver_id: receiverId, message })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'ส่งข้อความไม่สำเร็จ');
        }

        return { success: true, message: 'ส่งข้อความสอบถามเรียบร้อยแล้ว!' };
    } catch (error: any) {
        console.error("❌ Inquiry Error:", error);
        return { success: false, message: error.message };
    }
}