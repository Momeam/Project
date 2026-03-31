const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// [POST] Buyer sends inquiry to Seller
router.post('/', verifyToken, async (req, res) => {
    try {
        const { receiver_id, property_id, message } = req.body;
        if (!receiver_id || !property_id || !message) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const result = await pool.query(
            'INSERT INTO Inquiries (sender_id, receiver_id, property_id, message) VALUES ($1, $2, $3, $4) RETURNING *',
            [req.user.id, receiver_id, property_id, message]
        );
        res.status(201).json({ message: 'Inquiry sent', inquiry: result.rows[0] });
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
