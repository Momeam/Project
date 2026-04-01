const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken, verifyRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

// [GET] ค้นหาอสังหาฯ (Search & Filter)
router.get('/search', async (req, res) => {
    try {
        const { minPrice, maxPrice, province, type, category, bedrooms } = req.query;
        let query = 'SELECT * FROM Properties WHERE status = $1';
        const values = ['ACTIVE'];
        let count = 2;

        if (minPrice) { query += ` AND price >= $${count++}`; values.push(minPrice); }
        if (maxPrice) { query += ` AND price <= $${count++}`; values.push(maxPrice); }
        if (province) { query += ` AND province ILIKE $${count++}`; values.push(`%${province}%`); }
        if (type) { query += ` AND type = $${count++}`; values.push(type); }
        if (category) { query += ` AND category = $${count++}`; values.push(category); }
        if (bedrooms) { query += ` AND bedrooms >= $${count++}`; values.push(bedrooms); }

        query += ' ORDER BY createdAt DESC';
        const result = await pool.query(query, values);
        res.status(200).json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [GET] ดึงประกาศอสังหาฯ เฉพาะของผู้ขาย (Seller Properties)
router.get('/seller/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query('SELECT * FROM Properties WHERE userId = $1 ORDER BY createdAt DESC', [userId]);
        res.status(200).json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [GET] ดึงรายการอสังหาฯ ทั้งหมด
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Properties ORDER BY createdAt DESC');
        res.status(200).json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [GET] ดึงข้อมูลประกาศ "รายตัว"
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT p.*, u.username as owner_name, u.tel as owner_tel, u.line_id as owner_line, u.email as owner_email
            FROM Properties p
            LEFT JOIN Users u ON p.userId = CAST(u.id AS VARCHAR)
            WHERE p.id = $1
        `;
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'ไม่พบข้อมูลประกาศนี้' });
        
        const imagesResult = await pool.query('SELECT * FROM PropertyImages WHERE property_id = $1', [id]);
        const property = { ...result.rows[0], images: imagesResult.rows };
        res.status(200).json(property);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [POST] สร้างประกาศใหม่ (Requires Token & Seller/Admin Role)
router.post('/', verifyToken, verifyRole(['SELLER', 'ADMIN']), async (req, res) => {
    try {
        const p = req.body;
        if (!p.title || !p.price) return res.status(400).json({ error: 'กรุณากรอกหัวข้อและราคา' });

        const queryText = `INSERT INTO Properties 
            (userId, title, description, type, category, price, address, province, bedrooms, bathrooms, size, "interiorDetails", status) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'ACTIVE') RETURNING *`; 

        const values = [
            req.user.id, p.title, p.description || '', p.type || 'SALE', p.category || 'CONDO', p.price, 
            p.address || '', p.province || '', p.bedrooms || 0, p.bathrooms || 0, p.size || 0, p.interiorDetails || ''
        ];
        
        const result = await pool.query(queryText, values);
        res.status(201).json({ message: 'บันทึกสำเร็จ!', property: result.rows[0] });
    } catch (err) { res.status(500).json({ error: 'ไม่สามารถบันทึกข้อมูลได้' }); }
});

// [PUT] แก้ไขประกาศ
router.put('/:id', verifyToken, verifyRole(['SELLER', 'ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const p = req.body;
        
        // Ownership check
        const prop = await pool.query('SELECT userId FROM Properties WHERE id = $1', [id]);
        if (prop.rows.length === 0) return res.status(404).json({ error: 'ไม่พบข้อมูล' });
        if (prop.rows[0].userid != req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'คุณไม่ใช่เจ้าของประกาศนี้' });
        }

        const queryText = `UPDATE Properties SET title=$1, price=$2, description=$3, address=$4, "interiorDetails"=$5, status=$6 WHERE id=$7 RETURNING *`;
        const result = await pool.query(queryText, [p.title, p.price, p.description, p.address, p.interiorDetails || '', p.status || 'ACTIVE', id]);
        
        res.status(200).json({ message: 'แก้ไขสำเร็จ!', property: result.rows[0] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [DELETE] ลบประกาศ
router.delete('/:id', verifyToken, verifyRole(['SELLER', 'ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        
        const prop = await pool.query('SELECT userId FROM Properties WHERE id = $1', [id]);
        if (prop.rows.length === 0) return res.status(404).json({ error: 'ไม่พบข้อมูล' });
        if (prop.rows[0].userid != req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'คุณไม่ใช่เจ้าของประกาศนี้' });
        }

        await pool.query('DELETE FROM Properties WHERE id = $1', [id]);
        res.status(200).json({ message: 'ลบสำเร็จ! 🗑️' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [PATCH] เพิ่มจำนวนผู้เข้าชม
router.patch('/:id/view', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('UPDATE Properties SET "viewCount" = "viewCount" + 1 WHERE id = $1 RETURNING "viewCount"', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'ไม่พบประกาศ' });
        res.status(200).json({ viewCount: result.rows[0].viewCount });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==============================
// 📷 Images
// ==============================

// [POST] Upload Image using Multer
router.post('/:id/images', verifyToken, upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

        const imageUrl = `/uploads/${req.file.filename}`;
        const result = await pool.query('INSERT INTO PropertyImages (property_id, image_url) VALUES ($1, $2) RETURNING *', [id, imageUrl]);
        res.status(201).json({ message: 'Upload success', image: result.rows[0] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [DELETE] Delete Image
router.delete('/:id/images/:imageId', verifyToken, async (req, res) => {
    try {
        const { id, imageId } = req.params;
        const result = await pool.query('DELETE FROM PropertyImages WHERE id = $1 AND property_id = $2 RETURNING image_url', [imageId, id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Image not found' });
        
        const filepath = path.join(__dirname, '..', result.rows[0].image_url);
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath);

        res.status(200).json({ message: 'Image deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
