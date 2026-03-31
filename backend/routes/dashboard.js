const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken, verifyRole } = require('../middleware/auth');

// [GET] Stats (Admin Only)
router.get('/stats', verifyToken, verifyRole(['ADMIN']), async (req, res) => {
    try {
        const usersCount = await pool.query('SELECT COUNT(*) FROM Users');
        const sellersCount = await pool.query("SELECT COUNT(*) FROM Users WHERE role = 'SELLER'");
        const adminsCount = await pool.query("SELECT COUNT(*) FROM Users WHERE role = 'ADMIN'");
        const propertiesCount = await pool.query('SELECT COUNT(*) FROM Properties');
        const activePropertiesCount = await pool.query("SELECT COUNT(*) FROM Properties WHERE status = 'ACTIVE'");

        res.status(200).json({
            users: {
                total: parseInt(usersCount.rows[0].count),
                sellers: parseInt(sellersCount.rows[0].count),
                admins: parseInt(adminsCount.rows[0].count)
            },
            properties: {
                total: parseInt(propertiesCount.rows[0].count),
                active: parseInt(activePropertiesCount.rows[0].count)
            }
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
