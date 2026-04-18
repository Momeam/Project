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
        const unitsResult = await pool.query('SELECT * FROM CondoUnits WHERE property_id = $1 ORDER BY floor_number ASC, room_number ASC', [id]);
        
        const property = { 
            ...result.rows[0], 
            images: imagesResult.rows.map(img => ({ url: img.image_url })),
            units: unitsResult.rows
        };
        res.status(200).json(property);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. Operator: Insert
// การเพิ่มข้อมูลลงในฐานข้อมูล (INSERT)
// ใช้คำสั่ง SQL INSERT INTO Properties เพื่อบันทึกข้อมูลประกาศใหม่ลงในตาราง
router.post('/', upload.array('images'), async (req, res) => {
    try {
        const p = req.body;
        if (!p.title || !p.price) return res.status(400).json({ error: 'กรุณากรอกหัวข้อและราคา' });

        // 🟢 ตัดเรื่อง Token ออก: ถ้าไม่มี userId ส่งมาให้ใช้ 'anonymous' หรือ ID เริ่มต้น
        const userId = p.userId || 'anonymous';

        const queryText = `INSERT INTO Properties 
            (userId, title, description, type, category, price, address, province, bedrooms, bathrooms, size, "interiorDetails", status, is_project, total_floors, rooms_per_floor, house_layout, house_floors, blueprint_images) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'ACTIVE', $13, $14, $15, $16, $17, $18) RETURNING *`; 

        const values = [
            userId, p.title, p.description || '', p.type || 'SALE', p.category || 'CONDO', p.price, 
            p.address || '', p.province || '', p.bedrooms || 0, p.bathrooms || 0, p.size || 0, p.interiorDetails || '',
            p.isProject || false, p.totalFloors || 1, p.roomsPerFloor || 1,
            p.houseLayout ? JSON.stringify(p.houseLayout) : null,
            p.houseFloors || 1,
            p.blueprintImages ? (Array.isArray(p.blueprintImages) ? p.blueprintImages : JSON.parse(p.blueprintImages)) : null
        ];
        
        const result = await pool.query(queryText, values);
        const propertyId = result.rows[0].id;

        // 🏢 ถ้าเป็นโครงการ (isProject = true) ให้สร้างผังห้องจำลอง
        if (p.isProject && p.totalFloors && p.roomsPerFloor) {
            for (let floor = 1; floor <= p.totalFloors; floor++) {
                for (let room = 1; room <= p.roomsPerFloor; room++) {
                    const roomNumber = `${floor}${room.toString().padStart(2, '0')}`; // e.g., 101, 1205
                    await pool.query(
                        `INSERT INTO CondoUnits (property_id, floor_number, room_number, status, price) VALUES ($1, $2, $3, 'AVAILABLE', $4)`,
                        [propertyId, floor, roomNumber, p.price]
                    );
                }
            }
        }

        // 🖼️ เพิ่มรูปภาพที่อัปโหลดผ่าน Multer
        if (req.files && Array.isArray(req.files)) {
            for (const file of req.files) {
                const url = `/uploads/${file.filename}`;
                await pool.query('INSERT INTO PropertyImages (property_id, image_url) VALUES ($1, $2)', [propertyId, url]);
            }
        }

        // 🖼️ เพิ่มรูปภาพที่เป็น URL (ถ้ามีส่งมาแบบ JSON)
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
router.put('/:id', upload.array('images'), async (req, res) => {
    try {
        const { id } = req.params;
        const p = req.body;
        
        // 1. Update Property Record
        const queryText = `UPDATE Properties SET 
            title=$1, price=$2, description=$3, address=$4, "interiorDetails"=$5, status=$6, 
            bedrooms=$7, bathrooms=$8, size=$9, province=$10, 
            total_floors=$11, rooms_per_floor=$12,
            house_layout=$14, house_floors=$15, blueprint_images=$16
            WHERE id=$13 RETURNING *`;

        const values = [
            p.title, p.price, p.description, p.address, p.interiorDetails || '', p.status || 'ACTIVE',
            p.bedrooms || 0, p.bathrooms || 0, p.size || 0, p.province || '',
            p.totalFloors || 1, p.roomsPerFloor || 1, id,
            p.houseLayout ? JSON.stringify(p.houseLayout) : null,
            p.houseFloors || 1,
            p.blueprintImages ? (Array.isArray(p.blueprintImages) ? p.blueprintImages : JSON.parse(p.blueprintImages)) : null
        ];

        const result = await pool.query(queryText, values);
        
        if (result.rows.length === 0) return res.status(404).json({ error: 'ไม่พบข้อมูล' });

        // 2. Sync Units (Clean up ghost floors)
        if (p.totalFloors) {
            const newTotal = parseInt(p.totalFloors);
            // Delete units on floors that no longer exist
            await pool.query('DELETE FROM CondoUnits WHERE property_id = $1 AND floor_number > $2', [id, newTotal]);
            console.log(`🧹 Cleaned up units above floor ${newTotal} for property ${id}`);
        }
        // 3. Update Images (Add any new ones)
        if (req.files && Array.isArray(req.files)) {
            for (const file of req.files) {
                const url = `/uploads/${file.filename}`;
                await pool.query('INSERT INTO PropertyImages (property_id, image_url) VALUES ($1, $2)', [id, url]);
            }
        }

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

// [PATCH] อัปเดตรายละเอียดรายห้อง (สถานะ, ราคา, ขนาด, ฟีเจอร์, ผังภายใน)
router.patch('/units/:unitId', async (req, res) => {
    try {
        const { unitId } = req.params;
        const { status, price, size, features, layout_json } = req.body;
        
        const query = `
            UPDATE CondoUnits 
            SET status = COALESCE($1, status),
                price = COALESCE($2, price),
                size = COALESCE($3, size),
                features = COALESCE($4, features),
                layout_json = COALESCE($5, layout_json)
            WHERE id = $6 
            RETURNING *
        `;
        
        const result = await pool.query(query, [status, price, size, features, layout_json ? JSON.stringify(layout_json) : null, unitId]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'ไม่พบห้องนี้' });
        res.status(200).json({ message: 'อัปเดตข้อมูลห้องสำเร็จ', unit: result.rows[0] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [PATCH] อัปเดตสถานะห้องแบบย้อนหลัง (ยังเก็บไว้กันเหนียว)
router.patch('/units/:unitId/status', async (req, res) => {
    try {
        const { unitId } = req.params;
        const { status } = req.body;
        const result = await pool.query('UPDATE CondoUnits SET status = $1 WHERE id = $2 RETURNING *', [status, unitId]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'ไม่พบห้องนี้' });
        res.status(200).json({ message: 'อัปเดตสถานะห้องสำเร็จ', unit: result.rows[0] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [DELETE] ลบหัองทั้งชั้นออกจากโครงการ (Floor Reset)
router.delete('/:id/floors/:floorNumber/units', async (req, res) => {
    try {
        const { id, floorNumber } = req.params;
        await pool.query('DELETE FROM CondoUnits WHERE property_id = $1 AND floor_number = $2', [id, floorNumber]);
        res.status(200).json({ message: `ล้างข้อมูลชั้นที่ ${floorNumber} สำเร็จ!` });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [DELETE] ลบห้องออกจากผังโครงการ (สำหรับห้องที่ไม่มีอยู่จริง)
router.delete('/units/:unitId', async (req, res) => {
    try {
        const { unitId } = req.params;
        const result = await pool.query('DELETE FROM CondoUnits WHERE id = $1 RETURNING *', [unitId]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'ไม่พบห้องนี้' });
        res.status(200).json({ message: 'ลบห้องออกจากระบบสำเร็จ!' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [DELETE] ลบห้องแบบกลุ่ม (Bulk Delete) 
router.post('/units/bulk-delete', async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: 'Invalid IDs' });
        
        await pool.query('DELETE FROM CondoUnits WHERE id = ANY($1::int[])', [ids]);
        res.status(200).json({ message: 'ลบห้องแบบกลุ่มสำเร็จ!' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [PUT] บันทึกผังห้องแบบกลุ่ม (Bulk Update Layout)
router.put('/units/bulk', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { units } = req.body; // Array ของ { id, grid_x, grid_y, grid_w, grid_h, door_side, window_side, room_number, layout_json }
        
        for (const u of units) {
            const query = `
                UPDATE CondoUnits 
                SET grid_x = $1, grid_y = $2, grid_w = $3, grid_h = $4, 
                    door_side = $5, window_side = $6, room_number = $7,
                    unit_type = $8, layout_json = $9, status = $10, price = $11
                WHERE id = $12
            `;
            await client.query(query, [
                u.grid_x, u.grid_y, u.grid_w, u.grid_h, 
                u.door_side, u.window_side, u.room_number, 
                u.unit_type || 'ROOM', 
                u.layout_json ? JSON.stringify(u.layout_json) : null,
                u.status || 'AVAILABLE',
                u.price || 0,
                u.id
            ]);
        }
        
        await client.query('COMMIT');
        res.status(200).json({ message: 'บันทึกผังโครงการสำเร็จ!' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// [POST] เพิ่มห้องใหม่ในโครงการ (Manual Add Room)
router.post('/units', async (req, res) => {
    try {
        const { property_id, floor_number, room_number, grid_x, grid_y, grid_w, grid_h, price, unit_type, door_side, window_side, layout_json } = req.body;
        const query = `
            INSERT INTO CondoUnits (property_id, floor_number, room_number, grid_x, grid_y, grid_w, grid_h, status, price, unit_type, door_side, window_side, layout_json)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'AVAILABLE', $8, $9, $10, $11, $12) RETURNING *
        `;
        const result = await pool.query(query, [property_id, floor_number, room_number, grid_x || 0, grid_y || 0, grid_w || 1, grid_h || 1, price || 0, unit_type || 'ROOM', door_side || null, window_side || null, layout_json ? JSON.stringify(layout_json) : null]);
        res.status(201).json({ message: 'เพิ่มห้องสำเร็จ', unit: result.rows[0] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [POST] เพิ่มห้องแบบกลุ่ม (Bulk Create)
router.post('/units/bulk', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { units } = req.body;
        const insertedUnits = [];

        for (const u of units) {
            const query = `
                INSERT INTO CondoUnits (property_id, floor_number, room_number, grid_x, grid_y, grid_w, grid_h, status, price, unit_type, door_side, window_side, layout_json)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *
            `;
            const res = await client.query(query, [
                u.property_id, u.floor_number, u.room_number, u.grid_x, u.grid_y, u.grid_w, u.grid_h, 
                u.status || 'AVAILABLE', u.price || 0, u.unit_type || 'ROOM', u.door_side || null, u.window_side || null,
                u.layout_json ? JSON.stringify(u.layout_json) : null
            ]);
            insertedUnits.push(res.rows[0]);
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'สร้างห้องแบบกลุ่มสำเร็จ!', units: insertedUnits });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// ==============================
// 📷 Images
// ==============================

// [POST] Upload Image using Multer
router.post('/:id/images', upload.single('image'), async (req, res) => {
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
