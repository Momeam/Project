const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken } = require('../config/middleware/auth');

// [POST] ส่งข้อความ Chat
router.post('/', verifyToken, async (req, res) => {
    try {
        const { receiver_id, property_id, message } = req.body;
        const sender_id = req.user.id;

        if (!receiver_id || !property_id || !message) {
            return res.status(400).json({ error: 'ข้อมูลไม่ครบถ้วน' });
        }

        const result = await pool.query(
            'INSERT INTO Messages (sender_id, receiver_id, property_id, message) VALUES ($1, $2, $3, $4) RETURNING *',
            [sender_id, receiver_id, property_id, message]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// [GET] ดึงรายการสนทนา (Inbox)
router.get('/conversations', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // ดึงรายการล่าสุดของแต่ละคู่สนทนาและแต่ละ property
        const result = await pool.query(`
            SELECT DISTINCT ON (
                LEAST(m.sender_id, m.receiver_id), 
                GREATEST(m.sender_id, m.receiver_id), 
                m.property_id
            )
                m.*,
                CASE WHEN m.sender_id = $1 THEN r.username ELSE s.username END as other_name,
                CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END as other_user_id,
                CASE WHEN m.sender_id = $1 THEN r.role ELSE s.role END as other_role,
                p.title as property_title
            FROM Messages m
            JOIN Users s ON m.sender_id = s.id
            JOIN Users r ON m.receiver_id = r.id
            JOIN Properties p ON m.property_id = p.id
            WHERE m.sender_id = $1 OR m.receiver_id = $1
            ORDER BY 
                LEAST(m.sender_id, m.receiver_id), 
                GREATEST(m.sender_id, m.receiver_id), 
                m.property_id, 
                m.created_at DESC
        `, [userId]);

        const conversations = result.rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        res.status(200).json(conversations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// [GET] ดึงประวัติแชทกับ user คนใดคนหนึ่ง (ในบริบท property นั้น)
router.get('/:otherUserId/:propertyId', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { otherUserId, propertyId } = req.params;

        const result = await pool.query(`
            SELECT m.*, u.username as sender_name
            FROM Messages m
            JOIN Users u ON m.sender_id = u.id
            WHERE 
                ((m.sender_id = $1 AND m.receiver_id = $2) OR (m.sender_id = $2 AND m.receiver_id = $1))
                AND m.property_id = $3
            ORDER BY m.created_at ASC
        `, [userId, otherUserId, propertyId]);

        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// [PATCH] อัปเดตสถานะอ่านแล้ว
router.patch('/read/:otherUserId/:propertyId', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { otherUserId, propertyId } = req.params;

        await pool.query(`
            UPDATE Messages
            SET is_read = TRUE
            WHERE receiver_id = $1 AND sender_id = $2 AND property_id = $3 AND is_read = FALSE
        `, [userId, otherUserId, propertyId]);

        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
