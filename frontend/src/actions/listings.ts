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
        size: size
    };

    try {
        // 🚀 ยิงเข้า Backend ในเครื่องเดียวกัน (127.0.0.1) เสมอ
        const response = await fetch('http://127.0.0.1:5000/api/properties', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(propertyData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'บันทึกไม่สำเร็จ');
        }

        return { 
            success: true, 
            message: `ลงประกาศ "${title}" เรียบร้อยแล้ว! 🏠✨`
        };

    } catch (error: any) {
        console.error("❌ Action Error:", error);
        return { success: false, message: `เกิดข้อผิดพลาด: ${error.message}` };
    }
}