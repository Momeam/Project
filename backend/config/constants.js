const path = require('path');

// ใช้ process.cwd() เพื่อให้ชี้ไปยัง Root directory ของโปรเซสเสมอ (โฟลเดอร์ backend)
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

module.exports = {
    UPLOADS_DIR
};
