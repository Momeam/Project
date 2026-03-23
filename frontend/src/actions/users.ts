'use server';

import { VerificationStatus } from '@/stores/useAuthStore'; 

// Type ของ State ที่ส่งกลับ (เพิ่ม submittedData เพื่อส่งข้อมูลกลับไปให้ Client บันทึก)
type VerificationActionState = { 
    success: boolean; 
    message: string; 
    submittedData?: any; 
};

// Type ของ User Profile สำหรับดึงข้อมูลมาแสดง
export type UserProfile = {
    id: string; 
    email: string; 
    displayName: string | null; 
    phone: string | null;
    profileImageUrl: string | null; 
    lineId: string | null; 
    facebookUrl: string | null;
    verificationStatus: VerificationStatus; 
};

// --- 1. Action สำหรับส่งคำขอยืนยันตัวตน ---
export async function requestVerification(
    prevState: VerificationActionState, 
    formData: FormData 
): Promise<VerificationActionState> {
    
    // ดึงข้อมูลจาก Form
    const fullName = formData.get('fullName') as string;
    const idCardNumber = formData.get('idCardNumber') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    const lineId = formData.get('lineId') as string;
    const email = formData.get('email') as string;
    const documentFile = formData.get('document') as File;
    
    // ตรวจสอบความครบถ้วน
    if (!fullName || !idCardNumber || !phoneNumber || !lineId || !email || !documentFile || documentFile.size === 0) {
        return { success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วนและแนบเอกสาร' };
    }

    // ส่วนสำคัญ: แปลงไฟล์รูปภาพเป็น Base64 String 
    // (เพื่อให้แสดงผลได้จริงโดยไม่ต้องมี Server เก็บไฟล์ ในระบบ Mockup นี้)
    let documentUrl = 'https://placehold.co/600x400?text=No+Image'; // ค่า Default

    if (documentFile && documentFile.size > 0) {
        try {
            // 1. แปลง File เป็น ArrayBuffer
            const buffer = await documentFile.arrayBuffer();
            // 2. แปลง Buffer เป็น Base64 String
            const base64 = Buffer.from(buffer).toString('base64');
            // 3. สร้าง Data URL (เช่น data:image/jpeg;base64,...)
            documentUrl = `data:${documentFile.type};base64,${base64}`;
        } catch (error) {
            console.error("Error converting image:", error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ' };
        }
    }

    // สร้าง Object ข้อมูลที่จะส่งกลับไปบันทึกใน Store ฝั่ง Client
    const submittedData = {
        fullName,
        idCardNumber,
        phoneNumber,
        lineId,
        email,
        documentUrl, // ⭐️ ส่ง URL รูปภาพ (Base64) กลับไป
        submittedAt: new Date()
    };
    
    // จำลองเวลาประมวลผล (Loading)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { 
        success: true, 
        message: 'ส่งคำขอสำเร็จ! กรุณารอแอดมินอนุมัติ',
        submittedData // ⭐️ ส่งข้อมูลกลับไปให้ Client Component บันทึกลง Store
    };
}

// --- 2. Action สำหรับดึงข้อมูลโปรไฟล์ (Mockup) ---
export async function getUserProfile(): Promise<UserProfile> {
    const userId = 'seller_user_id_123'; 
    return {
        id: userId, 
        email: 'seller@example.com', 
        displayName: 'ชื่อผู้ขาย (ตัวอย่าง)',
        phone: '0812345678', 
        lineId: 'MyLineID123', 
        facebookUrl: 'https://facebook.com/seller.example',
        profileImageUrl: 'https://placehold.co/128x128/eeeeee/aaaaaa?text=Seller',
        verificationStatus: 'IDLE', 
    };
}

// --- 3. Action สำหรับอัปเดตโปรไฟล์ (Mockup) ---
export async function updateUserProfile(formData: FormData) {
    // ในระบบจริงต้องเขียนโค้ดอัปเดต Database ที่นี่
    return { success: true, message: 'อัปเดตโปรไฟล์สำเร็จ' };
}