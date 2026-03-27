const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const { Pool } = require('pg'); 
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ⚙️ 1. ตั้งค่าการเชื่อมต่อ Neon PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_4GSN5vqtrhzp@ep-nameless-dream-a1b3fs72-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
});

// 📱 เก็บ OTP ชั่วคราวใน Memory (ในระบบจริงควรใช้ Redis หรือ Database)
const otps = {};

// 🚀 ฟังก์ชันส่ง SMS จริง
async function sendRealSMS(tel, otp) {
    try {
        console.log(`[SMS Gateway] กำลังส่งรหัส ${otp} ไปยังเบอร์ ${tel}...`);
        
        // 1. ช่องทาง Twilio (สากล)
        if (process.env.TWILIO_SID && process.env.TWILIO_TOKEN) {
            const twilio = require('twilio');
            const client = new twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
            
            await client.messages.create({
                body: `HomeLink OTP: ${otp} (รหัสยืนยันตัวตนผู้ขายของคุณ)`,
                to: `+66${tel.substring(1)}`, 
                from: process.env.TWILIO_PHONE_NUMBER
            });
            console.log('✅ SMS Sent via Twilio');
            return true;
        }

        // 2. ช่องทาง SMS2PRO (ผู้ให้บริการในไทย - แนะนำสำหรับเบอร์ไทย)
        // ถ้าคุณมี API Key ของ SMS2PRO ให้ใส่ใน .env
        if (process.env.SMS2PRO_API_KEY) {
            const axios = require('axios');
            await axios.post('https://api.sms2pro.com/v1/sms', {
                recipient: tel,
                message: `HomeLink OTP: ${otp}`,
                sender: 'HomeLink'
            }, {
                headers: { 'Authorization': `Bearer ${process.env.SMS2PRO_API_KEY}` }
            });
            console.log('✅ SMS Sent via SMS2PRO');
            return true;
        }

        console.log('⚠️ [Mock Mode] ยังไม่ได้ตั้งค่า API Key ใน .env ระบบจะจำลองการส่งเท่านั้น');
        return true;
    } catch (error) {
        console.error('❌ SMS Sending Failed:', error.message);
        return false;
    }
}

// ===================================================
// 🛡️ Validation Functions - ตรวจสอบข้อมูลผู้สมัครผู้ขาย
// ===================================================

/**
 * ตรวจสอบเลขบัตรประชาชนไทย 13 หลัก (Checksum Algorithm)
 */
function validateThaiIdCard(id) {
    if (!id) return { isValid: false, message: 'กรุณากรอกเลขบัตรประชาชน' };
    const cleanId = id.replace(/[\s-]/g, '');
    if (!/^\d{13}$/.test(cleanId)) return { isValid: false, message: 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก' };
    if (cleanId[0] === '0') return { isValid: false, message: 'เลขบัตรประชาชนหลักแรกต้องไม่เป็น 0' };

    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += parseInt(cleanId[i]) * (13 - i);
    }
    const checkDigit = (11 - (sum % 11)) % 10;
    if (checkDigit !== parseInt(cleanId[12])) {
        return { isValid: false, message: 'เลขบัตรประชาชนไม่ถูกต้อง (Checksum ไม่ผ่าน)' };
    }
    return { isValid: true, message: 'OK' };
}

/**
 * ตรวจสอบเบอร์โทรศัพท์มือถือไทย
 */
function validateThaiPhoneNumber(tel) {
    if (!tel) return { isValid: false, message: 'กรุณากรอกเบอร์โทรศัพท์' };
    const cleanTel = tel.replace(/[\s-]/g, '');
    if (!/^\d{10}$/.test(cleanTel)) return { isValid: false, message: 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก' };
    if (!/^0[689]/.test(cleanTel)) return { isValid: false, message: 'เบอร์มือถือต้องเริ่มด้วย 06, 08 หรือ 09' };
    return { isValid: true, message: 'OK' };
}

/**
 * ตรวจสอบชื่อ-นามสกุลภาษาไทย
 */
function validateThaiFullName(name) {
    if (!name || !name.trim()) return { isValid: false, message: 'กรุณากรอกชื่อ-นามสกุล' };
    const trimmed = name.trim();
    // ตรวจว่ามีตัวอักษรภาษาไทย
    if (!/[\u0E00-\u0E7F]/.test(trimmed)) return { isValid: false, message: 'ชื่อ-นามสกุลต้องเป็นภาษาไทย' };
    const parts = trimmed.split(/\s+/).filter(p => p.length > 0);
    const prefixes = ['นาย', 'นาง', 'นางสาว', 'ด.ช.', 'ด.ญ.', 'เด็กชาย', 'เด็กหญิง'];
    let nameParts = [...parts];
    if (prefixes.includes(nameParts[0])) nameParts = nameParts.slice(1);
    if (nameParts.length < 2) return { isValid: false, message: 'กรุณากรอกทั้งชื่อและนามสกุล' };
    return { isValid: true, message: 'OK' };
}

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
                province VARCHAR(100), bedrooms INT, bathrooms INT, size INT, "interiorDetails" TEXT, status VARCHAR(50) DEFAULT 'ACTIVE',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 🗄️ สร้างตาราง Users (ผู้ใช้งาน)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS Users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                tel VARCHAR(20),
                full_name VARCHAR(255),
                id_card_number VARCHAR(13),
                line_id VARCHAR(100),
                role VARCHAR(20) DEFAULT 'USER',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // 🛠️ เพิ่มคอลัมน์ที่ขาดหายไป (Migration)
        await pool.query(`
            ALTER TABLE Users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
            ALTER TABLE Users ADD COLUMN IF NOT EXISTS id_card_number VARCHAR(13);
            ALTER TABLE Users ADD COLUMN IF NOT EXISTS line_id VARCHAR(100);
            ALTER TABLE Properties ADD COLUMN IF NOT EXISTS "interiorDetails" TEXT;
        `);
        
        // 🗄️ สร้างตาราง Announcements (ประกาศสิทธิพิเศษ)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS Announcements (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                type VARCHAR(50) DEFAULT 'PROMOTION', -- 'PROMOTION', 'INFO', 'URGENT'
                is_active BOOLEAN DEFAULT TRUE,
                admin_id INT,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        console.log('✅ Tables "Properties", "Users" & "Announcements" are ready!');
    } catch (err) {
        console.error('❌ Neon Database Connection Failed:', err);
    }
    pool.on('error', (err) => {
        console.error('⚠️ Database Connection Error (Idle):', err.message);
    });
}
connectPostgres();

// 📖 2. ตั้งค่า Swagger Documentation (หน้าคู่มือ API)
const swaggerDocument = {
    openapi: '3.0.0',
    info: {
        title: 'HomeLink API',
        version: '1.0.0',
        description: 'ระบบ API สำหรับจัดการอสังหาฯ และผู้ใช้งาน (สมบูรณ์)',
    },
    servers: [{ url: 'http://localhost:5000' }],
    components: {
        schemas: {
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
        // --- 👤 ส่วนของ Users ---
        '/api/users/register': {
            post: {
                summary: 'สมัครสมาชิกใหม่ (Register)',
                tags: ['Users'],
                requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/UserRegister' } } } },
                responses: { '201': { description: 'สมัครสมาชิกสำเร็จ' }, '400': { description: 'อีเมลนี้ถูกใช้งานแล้ว' } }
            }
        },
        '/api/users/login': {
            post: {
                summary: 'เข้าสู่ระบบ (Login)',
                tags: ['Users'],
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    email: { type: 'string', example: 'john@email.com' },
                                    password: { type: 'string', example: '12345678' }
                                }
                            }
                        }
                    }
                },
                responses: { '200': { description: 'เข้าสู่ระบบสำเร็จ' }, '401': { description: 'รหัสผ่านผิด' } }
            }
        },
        '/api/users': {
            get: {
                summary: 'ดึงรายชื่อผู้ใช้ทั้งหมด (For Admin)',
                tags: ['Users'],
                responses: { '200': { description: 'สำเร็จ' } }
            }
        },
        
        // --- 🏠 ส่วนของ Properties ---
        '/api/properties': {
            get: { 
                summary: 'ดึงรายการอสังหาฯ ทั้งหมด', 
                tags: ['Properties'], 
                responses: { '200': { description: 'สำเร็จ' } } 
            },
            post: { 
                summary: 'ลงประกาศใหม่ (Create)', 
                tags: ['Properties'], 
                requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Property' } } } }, 
                responses: { '201': { description: 'บันทึกสำเร็จ' }, '400': { description: 'ข้อมูลไม่ครบ' } } 
            }
        },
        '/api/properties/{id}': {
            get: {
                summary: 'ดึงข้อมูลประกาศรายตัว (Get by ID)',
                tags: ['Properties'],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: { '200': { description: 'ดึงข้อมูลสำเร็จ' }, '404': { description: 'ไม่พบข้อมูล' } }
            },
            put: { 
                summary: 'แก้ไขข้อมูลประกาศ (Update)', 
                tags: ['Properties'], 
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], 
                requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Property' } } } }, 
                responses: { '200': { description: 'แก้ไขสำเร็จ' } } 
            },
            delete: { 
                summary: 'ลบประกาศ (Delete)', 
                tags: ['Properties'], 
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], 
                responses: { '200': { description: 'ลบสำเร็จ' } } 
            }
        }
    }
};
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 🚀 3. API Routes (ส่วนการทำงานจริง)

// ==============================
// 👤 API สำหรับ Users
// ==============================

// [POST] สมัครสมาชิกใหม่
app.post('/api/users/register', async (req, res) => {
    try {
        const { username, email, password, tel } = req.body;
        
        const checkEmail = await pool.query('SELECT id FROM Users WHERE email = $1', [email]);
        if (checkEmail.rows.length > 0) {
            return res.status(400).json({ error: 'อีเมลนี้มีผู้ใช้งานแล้ว!' });
        }

        const queryText = `INSERT INTO Users (username, email, password, tel, role) VALUES ($1, $2, $3, $4, 'USER') RETURNING id, username, email, role`;
        const values = [username, email, password, tel]; 
        
        const result = await pool.query(queryText, values);
        res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ! 🎉', user: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// [POST] เข้าสู่ระบบ (Login)
app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' });
        }

        const result = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'อีเมล หรือ รหัสผ่านไม่ถูกต้อง!' });
        }

        const userData = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            tel: user.tel
        };

        res.status(200).json({ message: 'เข้าสู่ระบบสำเร็จ! 🎉', user: userData });
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเชื่อมต่อระบบ' });
    }
});

// [GET] ดึงข้อมูลผู้ใช้ทั้งหมด
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, email, tel, role, createdAt FROM Users ORDER BY createdAt DESC');
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// [PUT] อัปเดตบทบาทผู้ใช้ (Update User Role)
app.put('/api/users/:id/role', async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['USER', 'SELLER', 'ADMIN'].includes(role)) {
            return res.status(400).json({ error: 'บทบาทไม่ถูกต้อง (ต้องเป็น USER, SELLER หรือ ADMIN)' });
        }

        const queryText = 'UPDATE Users SET role = $1 WHERE id = $2 RETURNING id, username, email, role';
        const result = await pool.query(queryText, [role, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบผู้ใช้งานนี้' });
        }

        res.status(200).json({ message: 'อัปเดตบทบาทสำเร็จ! ✅', user: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// [DELETE] ลบผู้ใช้งาน (Admin Only)
app.delete('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // ตรวจสอบบทบาทของผู้ใช้ที่จะถูกลบก่อน
        const userResult = await pool.query('SELECT role FROM Users WHERE id = $1', [id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบผู้ใช้งานนี้' });
        }

        if (userResult.rows[0].role === 'ADMIN') {
            return res.status(403).json({ error: 'ไม่สามารถลบผู้ใช้งานที่มีสิทธิ์เป็น ADMIN ได้' });
        }

        const result = await pool.query('DELETE FROM Users WHERE id = $1 RETURNING id, username', [id]);
        res.status(200).json({ message: `ลบผู้ใช้ ${result.rows[0].username} สำเร็จ! 🗑️` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// [POST] ขอรหัส OTP สำหรับยืนยันตัวตน Seller ผ่านเบอร์โทรศัพท์
app.post('/api/users/request-otp', async (req, res) => {
    try {
        const { tel } = req.body;
        if (!tel) return res.status(400).json({ error: 'กรุณาระบุเบอร์โทรศัพท์' });

        // สร้าง OTP 6 หลัก
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otps[tel] = {
            code: otp,
            expires: Date.now() + 5 * 60 * 1000 // หมดอายุใน 5 นาที
        };

        // 🚀 ส่ง SMS จริง
        const sent = await sendRealSMS(tel, otp);
        
        if (!sent) {
            return res.status(500).json({ error: 'ไม่สามารถส่ง SMS ได้ในขณะนี้' });
        }
        
        res.status(200).json({ 
            message: 'ส่งรหัส OTP ไปยังเบอร์มือถือของคุณแล้ว', 
            otp: otp // สำหรับการทดสอบ (ในระบบจริงห้ามทำ!)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// [POST] ยืนยัน OTP และอัปเกรดเป็น SELLER (พร้อมบันทึกข้อมูลส่วนตัว)
app.post('/api/users/verify-otp', async (req, res) => {
    try {
        const { tel, otp, fullName, idCardNumber, email, lineId } = req.body;
        
        console.log(`[Verify OTP] รับข้อมูล: tel=${tel}, otp=${otp}, email=${email}`);
        
        const savedOtp = otps[tel];

        if (!savedOtp) {
            console.log(`❌ ไม่พบรหัส OTP สำหรับเบอร์ ${tel} (อาจเกิดจาก Server Restart)`);
            return res.status(400).json({ error: 'ไม่พบรหัส OTP หรือรหัสหมดอายุ (กรุณากดขอรหัสใหม่อีกครั้ง)' });
        }

        if (savedOtp.code !== otp) {
            console.log(`❌ รหัส OTP ไม่ถูกต้อง: กรอก=${otp}, จริง=${savedOtp.code}`);
            return res.status(400).json({ error: 'รหัส OTP ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง' });
        }

        if (Date.now() > savedOtp.expires) {
            console.log(`❌ รหัส OTP หมดอายุ`);
            return res.status(400).json({ error: 'รหัส OTP หมดอายุแล้ว กรุณากดขอรหัสใหม่' });
        }

        // ลบ OTP ทิ้งหลังใช้แล้ว
        delete otps[tel];

        // 🛡️ ตรวจสอบความถูกต้องของข้อมูลก่อนบันทึก
        const idCardResult = validateThaiIdCard(idCardNumber);
        if (!idCardResult.isValid) {
            return res.status(400).json({ error: `เลขบัตรประชาชนไม่ถูกต้อง: ${idCardResult.message}` });
        }

        const telResult = validateThaiPhoneNumber(tel);
        if (!telResult.isValid) {
            return res.status(400).json({ error: `เบอร์โทรศัพท์ไม่ถูกต้อง: ${telResult.message}` });
        }

        const nameResult = validateThaiFullName(fullName);
        if (!nameResult.isValid) {
            return res.status(400).json({ error: `ชื่อ-นามสกุลไม่ถูกต้อง: ${nameResult.message}` });
        }

        // 🛡️ ตรวจสอบซ้ำ: เลขบัตรประชาชนถูกใช้ไปแล้วหรือยัง
        const duplicateIdCard = await pool.query(
            'SELECT id, username FROM Users WHERE id_card_number = $1 AND email != $2',
            [idCardNumber, email]
        );
        if (duplicateIdCard.rows.length > 0) {
            return res.status(400).json({ error: 'เลขบัตรประชาชนนี้ถูกลงทะเบียนโดยผู้ใช้อื่นแล้ว' });
        }

        // 🛡️ ตรวจสอบซ้ำ: เบอร์โทรถูกใช้โดย SELLER คนอื่นแล้วหรือยัง
        const duplicateTel = await pool.query(
            "SELECT id, username FROM Users WHERE tel = $1 AND email != $2 AND role = 'SELLER'",
            [tel, email]
        );
        if (duplicateTel.rows.length > 0) {
            return res.status(400).json({ error: 'เบอร์โทรศัพท์นี้ถูกใช้สมัครเป็นผู้ขายโดยผู้ใช้อื่นแล้ว' });
        }

        // อัปเกรดบทบาทเป็น SELLER และบันทึกข้อมูลส่วนตัว
        const queryText = `
            UPDATE Users 
            SET role = 'SELLER', 
                full_name = $1, 
                id_card_number = $2, 
                tel = $3, 
                line_id = $4 
            WHERE email = $5 
            RETURNING id, username, email, role, full_name, id_card_number, tel, line_id
        `;
        const values = [fullName, idCardNumber, tel, lineId, email];
        const result = await pool.query(queryText, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบผู้ใช้งานที่ล็อกอินอยู่ (Email ไม่ตรง)' });
        }

        console.log(`✅ อัปเกรดผู้ใช้ ${result.rows[0].username} เป็น SELLER สำเร็จ!`);
        res.status(200).json({ message: 'ยืนยันตัวตนสำเร็จ! คุณเป็นผู้ขายแล้ว 🎉', user: result.rows[0] });
    } catch (err) {
        console.error('❌ Verify Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});


// ==============================
// 🏠 API สำหรับ Properties
// ==============================

// [GET] ดึงรายการอสังหาฯ ทั้งหมด
app.get('/api/properties', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Properties ORDER BY createdAt DESC');
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// [GET] ดึงข้อมูลประกาศ "รายตัว" ตาม ID
app.get('/api/properties/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM Properties WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบข้อมูลประกาศนี้' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// [POST] สร้างประกาศใหม่
app.post('/api/properties', async (req, res) => {
    try {
        const p = req.body;
        if (!p.title || !p.price) {
            return res.status(400).json({ error: 'กรุณากรอกหัวข้อและราคา' });
        }

        const queryText = `INSERT INTO Properties 
            (userId, title, description, type, category, price, address, province, bedrooms, bathrooms, size, "interiorDetails", status) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'ACTIVE') 
            RETURNING *`; 
        
        const values = [
            p.userId || '1', p.title, p.description || '', 
            p.type || 'SALE', p.category || 'CONDO', p.price, 
            p.address || '', p.province || '', p.bedrooms || 0, 
            p.bathrooms || 0, p.size || 0, p.interiorDetails || ''
        ];
        
        const result = await pool.query(queryText, values);
        res.status(201).json({ message: 'บันทึกสำเร็จลง Neon! 🏠', property: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'ไม่สามารถบันทึกข้อมูลได้' });
    }
});

// [PUT] แก้ไขประกาศ
app.put('/api/properties/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const p = req.body;
        const queryText = `UPDATE Properties SET title=$1, price=$2, description=$3, address=$4, "interiorDetails"=$5 WHERE id=$6 RETURNING *`;
        const values = [p.title, p.price, p.description, p.address, p.interiorDetails || '', id];
        const result = await pool.query(queryText, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบข้อมูลประกาศนี้' });
        }
        res.status(200).json({ message: `แก้ไข ID: ${id} เรียบร้อย! ✅`, property: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// [DELETE] ลบประกาศ
app.delete('/api/properties/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM Properties WHERE id = $1 RETURNING id', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบข้อมูลประกาศนี้' });
        }
        res.status(200).json({ message: `ลบ ID: ${id} สำเร็จ! 🗑️` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==============================
// 📢 API สำหรับ Announcements (สิทธิพิเศษ/ประกาศ)
// ==============================

// [GET] ดึงประกาศทั้งหมด (ที่กำลังใช้งาน)
app.get('/api/announcements', async (req, res) => {
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
app.post('/api/announcements', async (req, res) => {
    try {
        const { title, content, type, admin_id } = req.body;
        
        if (!title || !content) {
            return res.status(400).json({ error: 'กรุณากรอกหัวข้อและเนื้อหาประกาศ' });
        }

        const queryText = `
            INSERT INTO Announcements (title, content, type, admin_id) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *
        `;
        const values = [title, content, type || 'PROMOTION', admin_id];
        const result = await pool.query(queryText, values);
        
        res.status(201).json({ message: 'สร้างประกาศสำเร็จ! 📢', announcement: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// [DELETE] ลบประกาศ (Admin Only)
app.delete('/api/announcements/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM Announcements WHERE id = $1 RETURNING id', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบประกาศนี้' });
        }
        res.status(200).json({ message: `ลบประกาศสำเร็จ! 🗑️` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// [PUT] ปิด/เปิด การใช้งานประกาศ
app.put('/api/announcements/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;
        
        const result = await pool.query(
            'UPDATE Announcements SET is_active = $1 WHERE id = $2 RETURNING *',
            [is_active, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบประกาศนี้' });
        }
        res.status(200).json({ message: 'อัปเดตสถานะประกาศสำเร็จ! ✅', announcement: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🏃‍♂️ 4. Start Server
const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => { 
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📄 Swagger Docs available at http://localhost:${PORT}/api-docs`);
});