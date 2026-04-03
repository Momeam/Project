const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const verifyToken = async (req, res, next) => {
    try {
        const bearerHeader = req.headers['authorization'];
        if (!bearerHeader) {
            console.log('VerifyToken: No Authorization header found');
            return res.status(403).json({ error: 'ไม่พบ Token ถือว่าไม่มีสิทธิ์เข้าถึง' });
        }
        
        const token = bearerHeader.split(' ')[1];
        if (!token) {
            console.log('VerifyToken: Bearer token format is invalid');
            return res.status(403).json({ error: 'รูปแบบ Token ไม่ถูกต้อง' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_homelink_1234');
        
        if (!decoded || !decoded.id) {
            console.log('VerifyToken: Decoded token is missing ID');
            return res.status(401).json({ error: 'ข้อมูลใน Token ไม่สมบูรณ์ กรุณาล็อกอินใหม่' });
        }

        console.log(`VerifyToken: Decoded ID for User: ${decoded.id}`);

        // 🔒 Enforce Role from DB on every authenticated request
        let dbRole;
        try {
            const dbResult = await pool.query('SELECT role FROM Users WHERE id = $1', [decoded.id]);
            if (dbResult.rows.length === 0) {
                console.log(`VerifyToken: User ID ${decoded.id} not found in DB`);
                return res.status(401).json({ error: 'ไม่พบผู้ใช้นี้ในระบบ หรือถูกลบไปแล้ว' });
            }
            
            // Normalize Role (trim whitespace and convert to Uppercase)
            const rawRole = dbResult.rows[0].role;
            dbRole = (rawRole || '').trim().toUpperCase();
            
            console.log(`VerifyToken: User ID ${decoded.id} has Role: "${dbRole}" (Raw DB value: "${rawRole}")`);
        } catch (dbErr) {
            console.error('VerifyToken (DB Query Error):', dbErr.message);
            return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบฐานข้อมูล' });
        }
        
        // Attach user info with FRESH normalized role from DB
        req.user = { 
            ...decoded, 
            role: dbRole 
        };

        return next();
    } catch (err) {
        console.error('VerifyToken (Auth Error):', err.message);
        return res.status(401).json({ error: 'Token ไม่ถูกต้องหรือหมดอายุ' });
    }
};

const verifyRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.id) {
            console.log('VerifyRole: No req.user found');
            return res.status(403).json({ error: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้ (ไม่มีข้อมูลผู้ใช้)' });
        }

        console.log(`VerifyRole: checking User ID ${req.user.id} (Role: "${req.user.role}") against Allowed: ${roles}`);

        // 🛡️ Superuser Bypass: If Admin in DB, allow access everywhere
        if (req.user.role === 'ADMIN') {
            console.log(`VerifyRole: Admin Bypass GRANTED for User ID ${req.user.id}`);
            return next();
        }

        if (!roles.includes(req.user.role)) {
            console.log(`VerifyRole: access DENIED for user ${req.user.id} (Role: "${req.user.role}", Required: ${roles})`);
            return res.status(403).json({ error: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้ (สิทธิ์การเข้าถึงของคุณไม่ถูกต้อง)' });
        }
        
        console.log(`VerifyRole: access GRANTED for user ${req.user.id}`);
        return next();
    };
};

module.exports = { verifyToken, verifyRole };




