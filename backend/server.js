const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const { Pool } = require('pg'); 

const app = express();
app.use(cors());
app.use(express.json());

// ⚙️ 1. ตั้งค่าการเชื่อมต่อ Neon PostgreSQL (อย่าลืมใส่รหัสผ่านของคุณ)
const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_4GSN5vqtrhzp@ep-nameless-dream-a1b3fs72-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
});

// ฟังก์ชันเชื่อมต่อและสร้างตารางอัตโนมัติ
async function connectPostgres() {
    try {
        await pool.connect();
        console.log('✅ Neon PostgreSQL Connected!');

        // 🗄️ สร้างตาราง Properties (อสังหาฯ)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS Properties (
                id SERIAL PRIMARY KEY, userId VARCHAR(255), title VARCHAR(255), description TEXT,
                type VARCHAR(50), category VARCHAR(50), price DECIMAL(18,2), address VARCHAR(255),
                province VARCHAR(100), bedrooms INT, bathrooms INT, size INT, status VARCHAR(50) DEFAULT 'ACTIVE',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 🗄️ สร้างตาราง Users (ผู้ใช้งาน) 🌟 (เพิ่มใหม่!)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS Users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                tel VARCHAR(20),
                role VARCHAR(20) DEFAULT 'USER', -- สิทธิ์: USER, SELLER, ADMIN
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Tables "Properties" & "Users" are ready!');
    } catch (err) {
        console.error('❌ Neon Database Connection Failed:', err);
    }
    pool.on('error', (err) => {
    console.error('⚠️ Database Connection Error (Idle):', err.message);
});
}
connectPostgres();

// 📖 2. ตั้งค่า Swagger Documentation (เพิ่มระบบ Users)
const swaggerDocument = {
    openapi: '3.0.0',
    info: {
        title: 'HomeLink API',
        version: '1.0.0',
        description: 'ระบบ API สำหรับจัดการอสังหาฯ และผู้ใช้งาน',
    },
    servers: [{ url: 'http://localhost:5000' }],
    components: {
        schemas: {
            // โครงสร้างข้อมูล Properties
            Property: {
                type: 'object',
                properties: {
                    userId: { type: 'string', example: '1' },
                    title: { type: 'string', example: 'คอนโดหรูติดรถไฟฟ้า' },
                    description: { type: 'string', example: 'วิวสวย ห้องใหม่ เฟอร์ครบ' },
                    type: { type: 'string', example: 'SALE' },
                    category: { type: 'string', example: 'CONDO' },
                    price: { type: 'number', example: 2500000 },
                    address: { type: 'string', example: 'สุขุมวิท 101' },
                    province: { type: 'string', example: 'กรุงเทพ' },
                    bedrooms: { type: 'integer', example: 1 },
                    bathrooms: { type: 'integer', example: 1 },
                    size: { type: 'integer', example: 35 }
                }
            },
            // โครงสร้างข้อมูล Users 🌟 (เพิ่มใหม่!)
            UserRegister: {
                type: 'object',
                properties: {
                    username: { type: 'string', example: 'john_doe' },
                    email: { type: 'string', example: 'john@email.com' },
                    password: { type: 'string', example: '12345678' },
                    tel: { type: 'string', example: '0812345678' }
                }
            }
        }
    },
    paths: {
        // --- ส่วนของ Users ---
        '/api/users/register': {
            post: {
                summary: 'สมัครสมาชิกใหม่ (Register)',
                tags: ['Users'],
                requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/UserRegister' } } } },
                responses: { '201': { description: 'สมัครสมาชิกสำเร็จ' }, '400': { description: 'อีเมลนี้ถูกใช้งานแล้ว' } }
            }
        },
        '/api/users': {
            get: {
                summary: 'ดึงรายชื่อผู้ใช้ทั้งหมด (For Admin)',
                tags: ['Users'],
                responses: { '200': { description: 'สำเร็จ' } }
            }
        },
        // --- ส่วนของ Properties (เหมือนเดิม) ---
        '/api/properties': {
            get: { summary: 'ดึงรายการคอนโดทั้งหมด', tags: ['Properties'], responses: { '200': { description: 'สำเร็จ' } } },
            post: { summary: 'ลงประกาศใหม่ (Create)', tags: ['Properties'], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Property' } } } }, responses: { '201': { description: 'บันทึกสำเร็จ' } } }
        },
        '/api/properties/{id}': {
            put: { summary: 'แก้ไขข้อมูลประกาศ (Update)', tags: ['Properties'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Property' } } } }, responses: { '200': { description: 'แก้ไขสำเร็จ' } } },
            delete: { summary: 'ลบประกาศ (Delete)', tags: ['Properties'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'ลบสำเร็จ' } } }
        }
    }
};
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 🚀 3. API Routes

// --- API สำหรับ Users (เพิ่มใหม่!) ---

// [POST] สมัครสมาชิกใหม่
app.post('/api/users/register', async (req, res) => {
    try {
        const { username, email, password, tel } = req.body;
        
        // เช็กก่อนว่ามีอีเมลนี้ในระบบหรือยัง
        const checkEmail = await pool.query('SELECT id FROM Users WHERE email = $1', [email]);
        if (checkEmail.rows.length > 0) {
            return res.status(400).json({ error: 'อีเมลนี้มีผู้ใช้งานแล้ว!' });
        }

        // บันทึกลงฐานข้อมูล (กำหนดให้คนสมัครใหม่ทุกคนเป็น 'USER' ธรรมดาก่อน)
        const queryText = `INSERT INTO Users (username, email, password, tel, role) VALUES ($1, $2, $3, $4, 'USER') RETURNING id, username, email, role`;
        const values = [username, email, password, tel]; // ปล. ของจริงควรเข้ารหัสรหัสผ่าน (Hash) ก่อนบันทึกนะ
        
        const result = await pool.query(queryText, values);
        res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ! 🎉', user: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// [GET] ดึงข้อมูลผู้ใช้ทั้งหมด
app.get('/api/users', async (req, res) => {
    try {
        // ดึงมาโชว์แค่ข้อมูลที่ปลอดภัย (ไม่ดึงรหัสผ่านออกมา)
        const result = await pool.query('SELECT id, username, email, tel, role, createdAt FROM Users ORDER BY createdAt DESC');
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// [POST] เข้าสู่ระบบ (Login)
app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // 1. ค้นหาผู้ใช้จากอีเมลในฐานข้อมูล
        const result = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);
        const user = result.rows[0];

        // 2. เช็กว่าเจอผู้ใช้ไหม และรหัสผ่านตรงกันหรือเปล่า
        if (!user || user.password !== password) {
            // ถ้าไม่เจอ หรือรหัสผิด ให้เตือนกลับไป
            return res.status(401).json({ error: 'อีเมล หรือ รหัสผ่านไม่ถูกต้อง!' });
        }

        // 3. ถ้าสำเร็จ ส่งข้อมูล User กลับไปให้หน้าบ้าน (แต่แอบลบรหัสผ่านทิ้งก่อนส่งเพื่อความปลอดภัย)
        delete user.password;
        res.status(200).json({ message: 'เข้าสู่ระบบสำเร็จ! 🎉', user });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- API สำหรับ Properties (เหมือนเดิมเป๊ะๆ) ---

app.get('/api/properties', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Properties ORDER BY createdAt DESC');
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/properties', async (req, res) => {
    try {
        const p = req.body;
        const queryText = `INSERT INTO Properties (userId, title, description, type, category, price, address, province, bedrooms, bathrooms, size, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'ACTIVE')`;
        const values = [p.userId || '1', p.title, p.description, p.type, p.category, p.price, p.address, p.province, p.bedrooms, p.bathrooms, p.size];
        await pool.query(queryText, values);
        res.status(201).json({ message: 'บันทึกสำเร็จลง Neon! 🏠' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/properties/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const p = req.body;
        const queryText = `UPDATE Properties SET title=$1, price=$2, description=$3, address=$4 WHERE id=$5`;
        const values = [p.title, p.price, p.description, p.address, id];
        await pool.query(queryText, values);
        res.status(200).json({ message: `แก้ไข ID: ${id} เรียบร้อย! ✅` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/properties/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM Properties WHERE id = $1', [id]);
        res.status(200).json({ message: `ลบ ID: ${id} สำเร็จ! 🗑️` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🏃‍♂️ 4. Start Server
const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => { 
    console.log(`🚀 Server is running on port ${PORT}`);
});