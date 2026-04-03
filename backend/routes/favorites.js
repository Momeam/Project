const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken } = require('../config/middleware/auth');

// [POST] เพิ่มเข้ารายการโปรด (ต้อง Login)
router.post('/', verifyToken, async (req, res) => {
    try {
        const { property_id } = req.body;
        const user_id = req.user.id;

        const check = await pool.query('SELECT * FROM Favorites WHERE user_id = $1 AND property_id = $2', [user_id, property_id]);
        if (check.rows.length > 0) return res.status(400).json({ error: 'รายการนี้ถูกบันทึกไปแล้ว' });

        await pool.query('INSERT INTO Favorites (user_id, property_id) VALUES ($1, $2)', [user_id, property_id]);
        res.status(201).json({ message: 'บันทึกสำเร็จ' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [GET] List favorites (ต้อง Login)
router.get('/', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.*, f.id as favorite_id
            FROM Favorites f
            JOIN Properties p ON f.property_id = p.id
            WHERE f.user_id = $1
            ORDER BY f.createdAt DESC
        `, [req.user.id]);
        res.status(200).json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [DELETE] ลบออกจากรายการโปรด (ต้อง Login)
router.delete('/:propertyId', verifyToken, async (req, res) => {
    try {
        const { propertyId } = req.params;
        const user_id = req.user.id;
        
        await pool.query('DELETE FROM Favorites WHERE user_id = $1 AND property_id = $2', [user_id, propertyId]);
        res.status(200).json({ message: 'ลบสำเร็จ' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
