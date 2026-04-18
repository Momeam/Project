const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken } = require('../config/middleware/auth');

// [POST] ส่งข้อความสอบถาม → บันทึกลงทั้ง Inquiries และ Messages (sync กับระบบ Inbox)
router.post('/', verifyToken, async (req, res) => {
    try {
        const { receiver_id, property_id, message } = req.body;
        const sender_id = req.user ? req.user.id : null;

        if (!receiver_id || !property_id || !message) {
            return res.status(400).json({ error: 'ข้อมูลไม่ครบถ้วน' });
        }

        // 1. บันทึกลง Inquiries (ระบบเดิม)
        const result = await pool.query(
            'INSERT INTO Inquiries (sender_id, receiver_id, property_id, message) VALUES ($1, $2, $3, $4) RETURNING *',
            [sender_id, receiver_id, property_id, message]
        );

        // 2. Mirror ลง Messages ด้วย เพื่อให้ Inbox แสดงได้
        await pool.query(
            'INSERT INTO Messages (sender_id, receiver_id, property_id, message) VALUES ($1, $2, $3, $4)',
            [sender_id, receiver_id, property_id, message]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) { 
        console.error("❌ Inquiry POST Error:", err);
        res.status(500).json({ error: err.message }); 
    }
});

// [GET] ดึงรายการสอบถามสำหรับ Seller (เจ้าของประกาศ)
router.get('/', verifyToken, async (req, res) => {
    try {
        // เพิ่ม CAST เพื่อป้องกัน Type Mismatch ระหว่าง String และ Integer
        const result = await pool.query(`
            SELECT 
                i.*, 
                u.username as sender_name, 
                u.tel as sender_tel, 
                u.email as sender_email, 
                p.title as property_title
            FROM Inquiries i
            JOIN Users u ON CAST(i.sender_id AS VARCHAR) = CAST(u.id AS VARCHAR)
            LEFT JOIN Properties p ON CAST(i.property_id AS VARCHAR) = CAST(p.id AS VARCHAR)
            WHERE CAST(i.receiver_id AS VARCHAR) = CAST($1 AS VARCHAR)
            ORDER BY i."createdAt" DESC
        `, [req.user.id]);

        res.status(200).json(result.rows);
    } catch (err) { 
        console.error("❌ Inquiry GET Error:", err);
        res.status(500).json({ error: err.message }); 
    }
});

module.exports = router;