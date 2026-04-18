const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken } = require('../config/middleware/auth');

// ดึงแจ้งเตือนของ User คนที่ login
router.get('/', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM Notifications WHERE recipient_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// อัปเดตว่าอ่านแล้ว
router.put('/:id/read', verifyToken, async (req, res) => {
    try {
        await pool.query(
            'UPDATE Notifications SET is_read = TRUE WHERE id = $1 AND recipient_id = $2',
            [req.params.id, req.user.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;