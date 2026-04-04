const { pool } = require('./config/db');

async function check() {
    try {
        const res = await pool.query('SELECT is_project FROM Properties LIMIT 1');
        console.log("Column exists.");
    } catch (err) {
        console.log("Error:", err.message);
        if (err.message.includes('column "is_project" does not exist')) {
            console.log("Adding column...");
            await pool.query('ALTER TABLE Properties ADD COLUMN is_project BOOLEAN DEFAULT FALSE;');
            console.log("Column added.");
        }
    }
    
    try {
        const res2 = await pool.query('SELECT seller_type FROM Users LIMIT 1');
        console.log('seller_type exists.');
    } catch(err) {
        if(err.message.includes('column "seller_type" does not exist')) {
             await pool.query("ALTER TABLE Users ADD COLUMN seller_type VARCHAR(50) DEFAULT 'OWNER';");
             console.log("seller_type added.");
        }
    }

    try {
        const res3 = await pool.query('SELECT * FROM CondoUnits LIMIT 1');
        console.log('CondoUnits table exists.');
    } catch(err) {
        if(err.message.includes('relation "condounits" does not exist')) {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS CondoUnits (
                    id SERIAL PRIMARY KEY,
                    property_id INT REFERENCES Properties(id) ON DELETE CASCADE,
                    floor_number INT NOT NULL,
                    room_number VARCHAR(50) NOT NULL,
                    status VARCHAR(20) DEFAULT 'AVAILABLE',
                    price DECIMAL(18,2),
                    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('CondoUnits created.');
        }
    }

    pool.end();
    process.exit(0);
}
check();
