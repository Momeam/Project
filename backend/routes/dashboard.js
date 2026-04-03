const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken, verifyRole } = require('../config/middleware/auth');

// [GET] สถิติรวม
router.get('/stats', async (req, res) => {
    try {
        // 🟢 ตัดเรื่อง Admin Role Check ออกเพื่อให้ดึงสถิติได้เลย
        const userCount = await pool.query('SELECT COUNT(*) FROM Users');
        const sellerCount = await pool.query("SELECT COUNT(*) FROM Users WHERE role = 'SELLER'");
        const propertyCount = await pool.query('SELECT COUNT(*) FROM Properties');
        const activeCount = await pool.query("SELECT COUNT(*) FROM Properties WHERE status = 'ACTIVE'");

        res.status(200).json({
            users: parseInt(userCount.rows[0].count),
            sellers: parseInt(sellerCount.rows[0].count),
            properties: parseInt(propertyCount.rows[0].count),
            active: parseInt(activeCount.rows[0].count)
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
