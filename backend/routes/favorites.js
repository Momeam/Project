const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken } = require('../config/middleware/auth');

router.post('/', verifyToken, async (req, res) => {
    try {
        const { property_id } = req.body;
        const user_id = req.user.id;

        const check = await pool.query(
            'SELECT * FROM Favorites WHERE user_id = $1 AND property_id = $2',
            [user_id, property_id]
        );
        if (check.rows.length > 0)
            return res.status(400).json({ error: 'รายการนี้ถูกบันทึกไปแล้ว' });

        await pool.query(
            'INSERT INTO Favorites (user_id, property_id) VALUES ($1, $2)',
            [user_id, property_id]
        );

        const prop = await pool.query(
            'SELECT userid, title FROM Properties WHERE id = $1',
            [property_id]
        );
        if (prop.rows.length > 0) {
            await pool.query(
                `INSERT INTO Notifications (recipient_id, type, property_id, message)
                 VALUES ($1, 'FAVORITED', $2, $3)`,
                [prop.rows[0].userid, property_id, `มีคนบันทึกประกาศ "${prop.rows[0].title}" เข้า Wishlist`]
            );
        }

        res.status(201).json({ message: 'บันทึกสำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.*, f.id as favorite_id
            FROM Favorites f
            JOIN Properties p ON f.property_id = p.id
            WHERE f.user_id = $1
            ORDER BY f.createdat DESC
        `, [req.user.id]);
        res.status(200).json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:propertyId', verifyToken, async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM Favorites WHERE user_id = $1 AND property_id = $2',
            [req.user.id, req.params.propertyId]
        );
        res.status(200).json({ message: 'ลบสำเร็จ' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;