const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// [POST] Add to favorites
router.post('/', verifyToken, async (req, res) => {
    try {
        const { property_id } = req.body;
        const result = await pool.query(
            'INSERT INTO Favorites (user_id, property_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *', 
            [req.user.id, property_id]
        );
        res.status(201).json({ message: 'Added to favorites' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [GET] List favorites
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

// [DELETE] Remove favorite
router.delete('/:propertyId', verifyToken, async (req, res) => {
    try {
        const { propertyId } = req.params;
        await pool.query('DELETE FROM Favorites WHERE user_id = $1 AND property_id = $2', [req.user.id, propertyId]);
        res.status(200).json({ message: 'Removed from favorites' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
