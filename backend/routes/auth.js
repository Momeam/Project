const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { pool } = require('../config/db');
const rateLimit = require('express-rate-limit');

// ==========================================================
// 🛡️ Security: Rate Limiting สำหรับ OTP
// ป้องกันการถูกยิงรัว (Brute-force / Spam)
// ==========================================================
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 นาที
    max: 5, // จำกัด 5 ครั้งต่อ IP ภายใน 15 นาที
    message: { error: 'คุณขอ OTP บ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่' },
    standardHeaders: true,
    legacyHeaders: false,
});

// ==========================================================
// 📧 Email Configuration
// ==========================================================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

let otpStore = {};

// 🔒 ล้าง OTP ที่หมดอายุแล้วทุก 10 นาที (ป้องกัน Memory Leak)
setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    for (const email in otpStore) {
        if (otpStore[email].expires < now) {
            delete otpStore[email];
            cleaned++;
        }
    }
    if (cleaned > 0) console.log(`🧹 OTP Cleanup: ลบ ${cleaned} รายการที่หมดอายุออกแล้ว`);
}, 10 * 60 * 1000);

// ==========================================================
// 🚀 Routes
// ==========================================================

// [POST] ส่งรหัส OTP ไปที่อีเมล
router.post('/otp/send-email', otpLimiter, async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'กรุณาระบุอีเมล' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { otp: otp, expires: Date.now() + 5 * 60 * 1000 };

    const mailOptions = {
        from: `"HomeLink Verification" <${process.env.GMAIL_USER}>`, 
        to: email, 
        subject: 'รหัส OTP ยืนยันตัวตนผู้ขาย - HomeLink',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px;">
                <h2 style="color: #2563eb; text-align: center;">ยินดีต้อนรับสู่ HomeLink!</h2>
                <p style="text-align: center; color: #4b5563;">รหัส OTP สำหรับยืนยันตัวตนของคุณคือ:</p>
                <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111827;">${otp}</span>
                </div>
                <p style="color: #ef4444; font-size: 12px; text-align: center;">* รหัสนี้จะหมดอายุภายใน 5 นาที</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: 'ส่ง OTP เข้าอีเมลเรียบร้อย!' });
    } catch (error) {
        console.error('Nodemailer Error:', error);
        res.status(500).json({ error: 'ไม่สามารถส่งอีเมลได้ (โปรดเช็ค App Password)' });
    }
});

// [PUT] ตรวจสอบ OTP และอัปเกรดเป็นระดับ SELLER
router.put('/users/upgrade/:id', async (req, res) => {
    const { id } = req.params;
    const { otp, email, tel, realName, sellerType } = req.body;

    const record = otpStore[email];
    
    if (!record) return res.status(400).json({ error: 'ไม่พบคำขอ OTP หรือรหัสหมดอายุแล้ว' });
    if (record.otp !== otp) return res.status(400).json({ error: 'รหัส OTP ไม่ถูกต้อง!' });
    if (Date.now() > record.expires) return res.status(400).json({ error: 'รหัส OTP หมดอายุแล้ว!' });

    try {
        const type = sellerType || 'OWNER';
        // Note: use 'Users' table based on database setup
        const result = await pool.query(
            'UPDATE Users SET role = $1, tel = $2, username = $3, seller_type = $4 WHERE id = $5 RETURNING id, email, username, role, tel, seller_type',
            ['SELLER', tel, realName, type, id]
        );
        delete otpStore[email];
        res.json({ success: true, user: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
