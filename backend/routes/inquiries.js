const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken } = require('../config/middleware/auth');

// [POST] ส่งข้อความสอบถาม
router.post('/', async (req, res) => {
    try {
        const { receiver_id, property_id, message } = req.body;
        // 🟢 ตัดเรื่อง Token ออก: ถ้าไม่มี sender_id ให้ใช้ 'anonymous'
        const sender_id = req.user ? req.user.id : 'anonymous';

        if (!receiver_id || !property_id || !message) {
            return res.status(400).json({ error: 'ข้อมูลไม่ครบถ้วน' });
        }

        const result = await pool.query(
            'INSERT INTO Inquiries (sender_id, receiver_id, property_id, message) VALUES ($1, $2, $3, $4) RETURNING *',
            [sender_id, receiver_id, property_id, message]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [GET] Seller gets inquiries
router.get('/', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT i.*, u.username as sender_name, u.tel as sender_tel, u.email as sender_email, p.title as property_title
            FROM Inquiries i
            JOIN Users u ON i.sender_id = u.id
            LEFT JOIN Properties p ON i.property_id = p.id
            WHERE i.receiver_id = $1
            ORDER BY i.createdAt DESC
        `, [req.user.id]);
        res.status(200).json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
