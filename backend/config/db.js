const { Pool } = require('pg');
require('dotenv').config();

// 1. Operator: Connect
// การเชื่อมต่อฐานข้อมูล (Database Connection)
// ใช้ไลบรารี 'pg' (node-postgres) เพื่อสร้าง Pool สำหรับจัดการการเชื่อมต่อกับ PostgreSQL
// โดยดึงค่า DATABASE_URL จาก environment variables (.env) มาใช้ในการระบุที่อยู่และสิทธิ์การเข้าถึง
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_4GSN5vqtrhzp@ep-nameless-dream-a1b3fs72-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
});

async function connectPostgres() {
    try {
        await pool.connect();
        console.log('✅ Neon PostgreSQL Connected!');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS Properties (
                id SERIAL PRIMARY KEY, userId VARCHAR(255), title VARCHAR(255), description TEXT,
                type VARCHAR(50), category VARCHAR(50), price DECIMAL(18,2), address VARCHAR(255),
                province VARCHAR(100), bedrooms INT, bathrooms INT, size INT, "interiorDetails" TEXT, status VARCHAR(50) DEFAULT 'ACTIVE',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

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
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS Announcements (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                type VARCHAR(50) DEFAULT 'PROMOTION',
                is_active BOOLEAN DEFAULT TRUE,
                admin_id INT,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS PropertyImages (
                id SERIAL PRIMARY KEY,
                property_id INT REFERENCES Properties(id) ON DELETE CASCADE,
                image_url VARCHAR(500) NOT NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS Favorites (
                id SERIAL PRIMARY KEY,
                user_id INT REFERENCES Users(id) ON DELETE CASCADE,
                property_id INT REFERENCES Properties(id) ON DELETE CASCADE,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, property_id)
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS Inquiries (
                id SERIAL PRIMARY KEY,
                sender_id INT REFERENCES Users(id) ON DELETE CASCADE,
                receiver_id INT REFERENCES Users(id) ON DELETE CASCADE,
                property_id INT REFERENCES Properties(id) ON DELETE SET NULL,
                message TEXT NOT NULL,
                status VARCHAR(20) DEFAULT 'UNREAD',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        console.log('✅ All Tables are ready!');
    } catch (err) {
        console.error('❌ Neon Database Connection Failed:', err);
    }
}
connectPostgres();

module.exports = { pool };
