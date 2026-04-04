const { pool } = require('./config/db');

async function migrate() {
    try {
        await pool.query(`ALTER TABLE Properties ADD COLUMN IF NOT EXISTS is_project BOOLEAN DEFAULT FALSE;`);
        await pool.query(`ALTER TABLE Users ADD COLUMN IF NOT EXISTS seller_type VARCHAR(50) DEFAULT 'OWNER';`);
        console.log('✅ Columns added successfully.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

migrate();
