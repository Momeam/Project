// ===================================================
// 🛡️ Validator Functions - ตรวจสอบข้อมูลผู้สมัครผู้ขาย
// ===================================================

export interface ValidationResult {
    isValid: boolean;
    message: string;
}

/**
 * ตรวจสอบเลขบัตรประชาชนไทย 13 หลัก (Thai National ID Checksum Algorithm)
 * 
 * Algorithm:
 * 1. นำหลักที่ 1-12 มาคูณกับ 13, 12, 11, ..., 2 ตามลำดับ
 * 2. รวมผลคูณทั้งหมด
 * 3. หาเศษจากการหาร 11 (mod 11)
 * 4. นำ 11 ลบด้วยเศษ ได้ Check Digit
 * 5. ถ้า Check Digit >= 10 ให้ mod 10 อีกครั้ง
 * 6. Check Digit ต้องตรงกับหลักที่ 13
 */
export function validateThaiIdCard(id: string): ValidationResult {
    // ลบช่องว่างและขีด
    const cleanId = id.replace(/[\s-]/g, '');

    // ต้องเป็นตัวเลขเท่านั้น
    if (!/^\d+$/.test(cleanId)) {
        return { isValid: false, message: 'เลขบัตรประชาชนต้องเป็นตัวเลขเท่านั้น' };
    }

    // ต้องมี 13 หลัก
    if (cleanId.length !== 13) {
        return { isValid: false, message: `เลขบัตรประชาชนต้องมี 13 หลัก (ตอนนี้มี ${cleanId.length} หลัก)` };
    }

    // หลักแรกห้ามเป็น 0
    if (cleanId[0] === '0') {
        return { isValid: false, message: 'เลขบัตรประชาชนหลักแรกต้องไม่เป็น 0' };
    }

    // Checksum Algorithm
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += parseInt(cleanId[i]) * (13 - i);
    }
    const checkDigit = (11 - (sum % 11)) % 10;
    const lastDigit = parseInt(cleanId[12]);

    if (checkDigit !== lastDigit) {
        return { isValid: false, message: 'เลขบัตรประชาชนไม่ถูกต้อง (ไม่ผ่านการตรวจสอบ Checksum)' };
    }

    return { isValid: true, message: 'เลขบัตรประชาชนถูกต้อง ✅' };
}

/**
 * ตรวจสอบเบอร์โทรศัพท์มือถือไทย
 *
 * รูปแบบที่ถูกต้อง:
 * - เริ่มด้วย 0 ตามด้วย 6, 8, หรือ 9 (เบอร์มือถือไทย)
 * - รวมทั้งหมด 10 หลัก
 * เช่น 0612345678, 0812345678, 0912345678
 */
export function validateThaiPhoneNumber(tel: string): ValidationResult {
    const cleanTel = tel.replace(/[\s-]/g, '');

    if (!/^\d+$/.test(cleanTel)) {
        return { isValid: false, message: 'เบอร์โทรศัพท์ต้องเป็นตัวเลขเท่านั้น' };
    }

    if (cleanTel.length !== 10) {
        return { isValid: false, message: `เบอร์โทรศัพท์ต้องมี 10 หลัก (ตอนนี้มี ${cleanTel.length} หลัก)` };
    }

    // ต้องเริ่มด้วย 06, 08, หรือ 09
    if (!/^0[689]/.test(cleanTel)) {
        return { isValid: false, message: 'เบอร์มือถือต้องเริ่มด้วย 06, 08 หรือ 09' };
    }

    return { isValid: true, message: 'เบอร์โทรศัพท์ถูกต้อง ✅' };
}

/**
 * ตรวจสอบชื่อ-นามสกุลภาษาไทย
 *
 * เงื่อนไข:
 * 1. ต้องเป็นตัวอักษรภาษาไทย (อนุญาตให้มีคำนำหน้า เช่น นาย, นาง, นางสาว)
 * 2. ต้องมีอย่างน้อย 2 คำ (ชื่อ + นามสกุล)
 * 3. แต่ละคำต้องมีอย่างน้อย 2 ตัวอักษร
 */
export function validateThaiFullName(name: string): ValidationResult {
    const trimmedName = name.trim();

    if (!trimmedName) {
        return { isValid: false, message: 'กรุณากรอกชื่อ-นามสกุล' };
    }

    // ตรวจว่ามีตัวอักษรภาษาไทย (อนุญาตให้มีช่องว่าง, จุด, คำนำหน้า)
    // อนุญาต: ก-ฮ, สระ, วรรณยุกต์, ช่องว่าง, จุด
    if (!/^[ก-๙\s.]+$/.test(trimmedName)) {
        return { isValid: false, message: 'ชื่อ-นามสกุลต้องเป็นภาษาไทยเท่านั้น' };
    }

    // แยกชื่อออกเป็นคำ (ตัดช่องว่างซ้ำ)
    const parts = trimmedName.split(/\s+/).filter(p => p.length > 0);

    if (parts.length < 2) {
        return { isValid: false, message: 'กรุณากรอกทั้งชื่อและนามสกุล (เช่น สมชาย ใจดี)' };
    }

    // ตรวจชื่อและนามสกุล (ข้ามคำนำหน้า)
    const prefixes = ['นาย', 'นาง', 'นางสาว', 'ด.ช.', 'ด.ญ.', 'เด็กชาย', 'เด็กหญิง'];
    let nameParts = [...parts];

    // ถ้าคำแรกเป็นคำนำหน้า ให้ข้ามไป
    if (prefixes.includes(nameParts[0])) {
        nameParts = nameParts.slice(1);
    }

    if (nameParts.length < 2) {
        return { isValid: false, message: 'กรุณากรอกทั้งชื่อและนามสกุล (ไม่นับคำนำหน้า)' };
    }

    // ชื่อและนามสกุลต้องมีอย่างน้อย 2 ตัวอักษรขึ้นไป
    for (const part of nameParts) {
        if (part.length < 2) {
            return { isValid: false, message: `"${part}" สั้นเกินไป — แต่ละคำต้องมีอย่างน้อย 2 ตัวอักษร` };
        }
    }

    return { isValid: true, message: 'ชื่อ-นามสกุลถูกต้อง ✅' };
}

/**
 * ตรวจสอบข้อมูลทั้งหมดพร้อมกัน (สำหรับ validate ก่อน submit)
 */
export function validateAllSellerData(data: {
    fullName: string;
    idCardNumber: string;
    tel: string;
}): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    const nameResult = validateThaiFullName(data.fullName);
    if (!nameResult.isValid) errors.fullName = nameResult.message;

    const idResult = validateThaiIdCard(data.idCardNumber);
    if (!idResult.isValid) errors.idCardNumber = idResult.message;

    const telResult = validateThaiPhoneNumber(data.tel);
    if (!telResult.isValid) errors.tel = telResult.message;

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}
