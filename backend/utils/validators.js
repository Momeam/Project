function validateThaiIdCard(id) {
    if (!id) return { isValid: false, message: 'กรุณากรอกเลขบัตรประชาชน' };
    const cleanId = id.replace(/[\s-]/g, '');
    if (!/^\d{13}$/.test(cleanId)) return { isValid: false, message: 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก' };
    if (cleanId[0] === '0') return { isValid: false, message: 'เลขบัตรประชาชนหลักแรกต้องไม่เป็น 0' };
    let sum = 0;
    for (let i = 0; i < 12; i++) sum += parseInt(cleanId[i]) * (13 - i);
    const checkDigit = (11 - (sum % 11)) % 10;
    if (checkDigit !== parseInt(cleanId[12])) return { isValid: false, message: 'เลขบัตรประชาชนไม่ถูกต้อง (Checksum ไม่ผ่าน)' };
    return { isValid: true, message: 'OK' };
}

function validateThaiPhoneNumber(tel) {
    if (!tel) return { isValid: false, message: 'กรุณากรอกเบอร์โทรศัพท์' };
    const cleanTel = tel.replace(/[\s-]/g, '');
    if (!/^\d{10}$/.test(cleanTel)) return { isValid: false, message: 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก' };
    if (!/^0[689]/.test(cleanTel)) return { isValid: false, message: 'เบอร์มือถือต้องเริ่มด้วย 06, 08 หรือ 09' };
    return { isValid: true, message: 'OK' };
}

function validateThaiFullName(name) {
    if (!name || !name.trim()) return { isValid: false, message: 'กรุณากรอกชื่อ-นามสกุล' };
    const trimmed = name.trim();
    if (!/[\u0E00-\u0E7F]/.test(trimmed)) return { isValid: false, message: 'ชื่อ-นามสกุลต้องเป็นภาษาไทย' };
    const parts = trimmed.split(/\s+/).filter(p => p.length > 0);
    const prefixes = ['นาย', 'นาง', 'นางสาว', 'ด.ช.', 'ด.ญ.', 'เด็กชาย', 'เด็กหญิง'];
    let nameParts = [...parts];
    if (prefixes.includes(nameParts[0])) nameParts = nameParts.slice(1);
    if (nameParts.length < 2) return { isValid: false, message: 'กรุณากรอกทั้งชื่อและนามสกุล' };
    return { isValid: true, message: 'OK' };
}

module.exports = {
    validateThaiIdCard,
    validateThaiPhoneNumber,
    validateThaiFullName
};
