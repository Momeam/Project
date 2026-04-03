const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { validateThaiIdCard, validateThaiPhoneNumber, validateThaiFullName } = require('../utils/validators');
const { otps, sendRealSMS } = require('../utils/sms');
const { verifyToken, verifyRole } = require('../config/middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_homelink_1234';

// ==============================
// 🔐 Auth & Profile Routes
// ==============================

// [POST] Register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, tel } = req.body;
        const checkEmail = await pool.query('SELECT id FROM Users WHERE email = $1', [email]);
        if (checkEmail.rows.length > 0) return res.status(400).json({ error: 'อีเมลนี้มีผู้ใช้งานแล้ว!' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            `INSERT INTO Users (username, email, password, tel, role) VALUES ($1, $2, $3, $4, 'USER') RETURNING id, username, email, role`,
            [username, email, hashedPassword, tel]
        );
        res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ! 🎉', user: result.rows[0] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [POST] Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' });

        const result = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);
        const user = result.rows[0];

        let isMatch = false;
        if (user) {
            if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
                isMatch = await bcrypt.compare(password, user.password);
            } else {
                isMatch = (user.password === password);
            }
        }

        if (!user || !isMatch) return res.status(401).json({ error: 'อีเมล หรือ รหัสผ่านไม่ถูกต้อง!' });

        const userData = { id: user.id, username: user.username, email: user.email, role: user.role, tel: user.tel };
        const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '1d' });

        res.status(200).json({ message: 'เข้าสู่ระบบสำเร็จ! 🎉', user: userData, token });
    } catch (err) { res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเชื่อมต่อระบบ' }); }
});

// [GET] Me
router.get('/me', verifyToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, email, tel, full_name, line_id, role, id_card_number FROM Users WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.status(200).json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [PUT] Me
router.put('/me', verifyToken, async (req, res) => {
    try {
        const { username, tel, line_id } = req.body;
        const result = await pool.query(
            'UPDATE Users SET username = COALESCE($1, username), tel = COALESCE($2, tel), line_id = COALESCE($3, line_id) WHERE id = $4 RETURNING id, username, email, tel, line_id',
            [username, tel, line_id, req.user.id]
        );
        res.status(200).json({ message: 'อัปเดตโปรไฟล์สำเร็จ', user: result.rows[0] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [PUT] Change Password
router.put('/change-password', verifyToken, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const result = await pool.query('SELECT password FROM Users WHERE id = $1', [req.user.id]);
        const user = result.rows[0];

        let isMatch = false;
        if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
            isMatch = await bcrypt.compare(oldPassword, user.password);
        } else {
            isMatch = (user.password === oldPassword);
        }

        if (!isMatch) return res.status(400).json({ error: 'รหัสผ่านเดิมไม่ถูกต้อง' });

        const hashedNew = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE Users SET password = $1 WHERE id = $2', [hashedNew, req.user.id]);
        res.status(200).json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [POST] Forgot Password (Stub)
router.post('/forgot-password', async (req, res) => {
    res.status(200).json({ message: 'ส่งอีเมลสำหรับรีเซ็ตรหัสผ่านแล้ว (จำลอง)' });
});

// [POST] Reset Password (Stub)
router.post('/reset-password', async (req, res) => {
    res.status(200).json({ message: 'รีเซ็ตรหัสผ่านสำเร็จ (จำลอง)' });
});

// ==============================
// 👤 Admin & User Management
// ==============================

// [GET] ดึงข้อมูลผู้ใช้ทั้งหมด (Admin)
router.get('/', verifyToken, verifyRole(['ADMIN']), async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, email, tel, role, createdAt FROM Users ORDER BY createdAt DESC');
        res.status(200).json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [PUT] อัปเดตบทบาทผู้ใช้
router.put('/:id/role', verifyToken, verifyRole(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (!['USER', 'SELLER'].includes(role)) return res.status(400).json({ error: 'ไม่สามารถตั้งค่าสิทธิ์เป็น ADMIN ผ่านระบบนี้ได้' });

        const result = await pool.query('UPDATE Users SET role = $1 WHERE id = $2 RETURNING id, username, email, role', [role, id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'ไม่พบผู้ใช้งานนี้' });

        res.status(200).json({ message: 'อัปเดตบทบาทสำเร็จ! ✅', user: result.rows[0] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [DELETE] ลบผู้ใช้งาน
router.delete('/:id', verifyToken, verifyRole(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const userResult = await pool.query('SELECT role FROM Users WHERE id = $1', [id]);
        if (userResult.rows.length === 0) return res.status(404).json({ error: 'ไม่พบผู้ใช้งานนี้' });
        if (userResult.rows[0].role === 'ADMIN') return res.status(403).json({ error: 'ไม่สามารถลบผู้ใช้งาน ADMIN ได้' });

        const result = await pool.query('DELETE FROM Users WHERE id = $1 RETURNING username', [id]);
        res.status(200).json({ message: `ลบผู้ใช้ ${result.rows[0].username} สำเร็จ! 🗑️` });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==============================
// 📱 Seller Verification
// ==============================

// [POST] ขอรหัส OTP
router.post('/request-otp', verifyToken, async (req, res) => {
    try {
        const { tel } = req.body;
        if (!tel) return res.status(400).json({ error: 'กรุณาระบุเบอร์โทรศัพท์' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otps[tel] = { code: otp, expires: Date.now() + 5 * 60 * 1000 };

        const sent = await sendRealSMS(tel, otp);
        if (!sent) return res.status(500).json({ error: 'ไม่สามารถส่ง SMS ได้ในขณะนี้' });
        
        res.status(200).json({ message: 'ส่งรหัส OTP แล้ว', otp }); // For testing
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [POST] ยืนยัน OTP อัปเกรดเป็น SELLER
router.post('/verify-otp', verifyToken, async (req, res) => {
    try {
        const { tel, otp, fullName, idCardNumber, lineId } = req.body;
        const savedOtp = otps[tel];

        if (!savedOtp) return res.status(400).json({ error: 'ไม่พบรหัส OTP หรือรหัสหมดอายุ' });
        if (savedOtp.code !== otp) return res.status(400).json({ error: 'รหัส OTP ไม่ถูกต้อง' });
        if (Date.now() > savedOtp.expires) return res.status(400).json({ error: 'รหัส OTP หมดอายุแล้ว' });

        delete otps[tel];

        const idCardResult = validateThaiIdCard(idCardNumber);
        if (!idCardResult.isValid) return res.status(400).json({ error: idCardResult.message });

        const telResult = validateThaiPhoneNumber(tel);
        if (!telResult.isValid) return res.status(400).json({ error: telResult.message });

        const nameResult = validateThaiFullName(fullName);
        if (!nameResult.isValid) return res.status(400).json({ error: nameResult.message });

        const duplicateIdCard = await pool.query('SELECT id FROM Users WHERE id_card_number = $1 AND id != $2', [idCardNumber, req.user.id]);
        if (duplicateIdCard.rows.length > 0) return res.status(400).json({ error: 'เลขบัตรประชาชนนี้ถูกใช้แล้ว' });

        const result = await pool.query(
            `UPDATE Users SET role = 'SELLER', full_name = $1, id_card_number = $2, tel = $3, line_id = $4 WHERE id = $5 RETURNING *`,
            [fullName, idCardNumber, tel, lineId, req.user.id]
        );

        res.status(200).json({ message: 'ยืนยันตัวตนสำเร็จ! 🎉', user: result.rows[0] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
