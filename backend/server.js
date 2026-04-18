const express = require('express');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer'); // 🟢 ย้ายมาไว้ข้างบนสุดให้เป็นระเบียบ
require('dotenv').config();

// Connect to DB and create tables if not exists
require('./config/db');

// Swagger setup
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./config/swagger');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ แบบใหม่ (ชี้เป้าไปที่ config/uploads ให้ตรงกัน)
app.use('/uploads', express.static(path.join(__dirname, 'config', 'uploads')));

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/properties', require('./routes/properties'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/notifications', require('./routes/notifications'));

// Docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// 🟢 เพิ่มเส้นทางสำหรับ Notifications
// ==========================================================
// 🟢 ส่วนระบบ OTP (ต้องวางไว้ตรงนี้ ก่อนตัวดัก 404)
// ==========================================================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'memza007@gmail.com', // อีเมลของคุณ
        pass: 'uvbq ohpx sdpf vass'  // รหัสผ่านแอป
    }
});

let otpStore = {}; 

app.post('/api/otp/send-email', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'กรุณาระบุอีเมล' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { otp: otp, expires: Date.now() + 5 * 60 * 1000 };

    const mailOptions = {
        from: '"HomeLink Verification" <memza007@gmail.com>', 
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

app.put('/api/users/upgrade/:id', async (req, res) => {
    const { id } = req.params;
    const { otp, email, tel, realName, sellerType } = req.body;

    const record = otpStore[email];
    
    if (!record) return res.status(400).json({ error: 'ไม่พบคำขอ OTP หรือรหัสหมดอายุแล้ว' });
    if (record.otp !== otp) return res.status(400).json({ error: 'รหัส OTP ไม่ถูกต้อง!' });
    if (Date.now() > record.expires) return res.status(400).json({ error: 'รหัส OTP หมดอายุแล้ว!' });

        try {
            const { pool } = require('./config/db'); // ดึง pool มาใช้ตรงนี้เพื่อความชัวร์
            const type = sellerType || 'OWNER';
            const result = await pool.query(
            'UPDATE users SET role = $1, tel = $2, username = $3, seller_type = $4 WHERE id = $5 RETURNING id, email, username, role, tel, seller_type',
            ['SELLER', tel, realName, type, id]
            );
            delete otpStore[email];
            res.json({ success: true, user: result.rows[0] });
            } catch (err) {
            res.status(500).json({ error: err.message });
        }
        });
// ==========================================================


// 🔴 ยามเฝ้าประตู 404 (ต้องอยู่ "ล่างสุด" เสมอครับ!)
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint Not Found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => { 
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📄 Swagger Docs available at http://localhost:${PORT}/api-docs`);
});