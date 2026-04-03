const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken, verifyRole } = require('../config/middleware/auth');
const upload = require('../config/middleware/upload');
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

// 2. Operator: Select
// การดึงข้อมูลจากฐานข้อมูล (SELECT)
// ใช้คำสั่ง SQL SELECT * FROM Properties เพื่อเลือกข้อมูลทั้งหมดจากตารางประกาศอสังหาริมทรัพย์
// โดยมีการจัดเรียงลำดับตามวันที่สร้าง (createdAt) จากใหม่ไปเก่า
router.get('/', async (req, res) => {
    try {
        // ดึงข้อมูล Property ทั้งหมด
        const result = await pool.query('SELECT * FROM Properties ORDER BY createdAt DESC');
        const properties = result.rows;

        // ดึงรูปภาพทั้งหมดมา Map เข้ากับ Property
        const imagesResult = await pool.query('SELECT * FROM PropertyImages');
        const allImages = imagesResult.rows;

        const propertiesWithImages = properties.map(p => ({
            ...p,
            images: allImages.filter(img => img.property_id === p.id).map(img => ({ url: img.image_url }))
        }));

        res.status(200).json(propertiesWithImages);
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
        const property = { 
            ...result.rows[0], 
            images: imagesResult.rows.map(img => ({ url: img.image_url })) // Map ให้เป็น format { url: '...' }
        };
        res.status(200).json(property);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. Operator: Insert
// การเพิ่มข้อมูลลงในฐานข้อมูล (INSERT)
// ใช้คำสั่ง SQL INSERT INTO Properties เพื่อบันทึกข้อมูลประกาศใหม่ลงในตาราง
router.post('/', async (req, res) => {
    try {
        const p = req.body;
        if (!p.title || !p.price) return res.status(400).json({ error: 'กรุณากรอกหัวข้อและราคา' });

        // 🟢 ตัดเรื่อง Token ออก: ถ้าไม่มี userId ส่งมาให้ใช้ 'anonymous' หรือ ID เริ่มต้น
        const userId = p.userId || 'anonymous';

        const queryText = `INSERT INTO Properties 
            (userId, title, description, type, category, price, address, province, bedrooms, bathrooms, size, "interiorDetails", status) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'ACTIVE') RETURNING *`; 

        const values = [
            userId, p.title, p.description || '', p.type || 'SALE', p.category || 'CONDO', p.price, 
            p.address || '', p.province || '', p.bedrooms || 0, p.bathrooms || 0, p.size || 0, p.interiorDetails || ''
        ];
        
        const result = await pool.query(queryText, values);
        const propertyId = result.rows[0].id;

        // 🖼️ เพิ่มรูปภาพ (ถ้ามีส่งมา)
        if (p.imageUrls && Array.isArray(p.imageUrls)) {
            for (const url of p.imageUrls) {
                await pool.query('INSERT INTO PropertyImages (property_id, image_url) VALUES ($1, $2)', [propertyId, url]);
            }
        }
        
        res.status(201).json({ message: 'บันทึกสำเร็จ!', property: result.rows[0] });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: 'ไม่สามารถบันทึกข้อมูลได้' }); 
    }
});

// 4. Operator: Update
// การแก้ไขข้อมูลในฐานข้อมูล (UPDATE)
// ใช้คำสั่ง SQL UPDATE Properties เพื่อแก้ไขฟิลด์ข้อมูลในแถวที่มี ID ตรงกับที่ระบุ
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const p = req.body;
        
        // 🟢 ตัดเรื่อง Ownership check (Token) ออกเพื่อให้แก้ไขได้เลย
        const queryText = `UPDATE Properties SET title=$1, price=$2, description=$3, address=$4, "interiorDetails"=$5, status=$6 WHERE id=$7 RETURNING *`;
        const result = await pool.query(queryText, [p.title, p.price, p.description, p.address, p.interiorDetails || '', p.status || 'ACTIVE', id]);
        
        if (result.rows.length === 0) return res.status(404).json({ error: 'ไม่พบข้อมูล' });
        res.status(200).json({ message: 'แก้ไขสำเร็จ!', property: result.rows[0] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 5. Operator: Delete
// การลบข้อมูลออกจากฐานข้อมูล (DELETE)
// ใช้คำสั่ง SQL DELETE FROM Properties WHERE id = $1 เพื่อลบแถวข้อมูลตาม ID ที่ส่งมา
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // 🟢 ตัดเรื่อง Ownership check (Token) ออกเพื่อให้ลบได้เลย
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
