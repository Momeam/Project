const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken, verifyRole } = require('../config/middleware/auth');

// [GET] ดึงประกาศทั้งหมด (ที่กำลังใช้งาน)
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT a.*, u.username as admin_name 
            FROM Announcements a
            LEFT JOIN Users u ON a.admin_id = u.id
            WHERE a.is_active = TRUE
            ORDER BY a.createdAt DESC
        `);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// [POST] สร้างประกาศใหม่ (Admin Only)
router.post('/', verifyToken, verifyRole(['ADMIN']), async (req, res) => {
    try {
        const { title, content, type } = req.body;
        if (!title || !content) return res.status(400).json({ error: 'กรุณากรอกหัวข้อและเนื้อหาประกาศ' });

        const result = await pool.query(
            `INSERT INTO Announcements (title, content, type, admin_id) VALUES ($1, $2, $3, $4) RETURNING *`,
            [title, content, type || 'PROMOTION', req.user.id]
        );
        res.status(201).json({ message: 'สร้างประกาศสำเร็จ! 📢', announcement: result.rows[0] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [PUT] อัปเดตประกาศ (Admin Only)
router.put('/:id', verifyToken, verifyRole(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, type } = req.body;
        
        const result = await pool.query(
            'UPDATE Announcements SET title = $1, content = $2, type = $3 WHERE id = $4 RETURNING *',
            [title, content, type, id]
        );
        
        if (result.rows.length === 0) return res.status(404).json({ error: 'ไม่พบประกาศนี้' });
        res.status(200).json({ message: 'อัปเดตประกาศสำเร็จ! ✅', announcement: result.rows[0] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [PUT] ปิด/เปิด การใช้งานประกาศ (Admin Only)
router.put('/:id/status', verifyToken, verifyRole(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;
        const result = await pool.query('UPDATE Announcements SET is_active = $1 WHERE id = $2 RETURNING *', [is_active, id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'ไม่พบประกาศนี้' });
        res.status(200).json({ message: 'อัปเดตสถานะประกาศสำเร็จ! ✅', announcement: result.rows[0] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [DELETE] ลบประกาศ (Admin Only)
router.delete('/:id', verifyToken, verifyRole(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM Announcements WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'ไม่พบประกาศนี้' });
        res.status(200).json({ message: 'ลบประกาศสำเร็จ! 🗑️' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
