const { pool } = require('./config/db');

async function migrate() {
    try {
        console.log("Adding 'layout_json' column to 'CondoUnits' table...");
        await pool.query('ALTER TABLE CondoUnits ADD COLUMN IF NOT EXISTS layout_json JSONB;');
        console.log("Column 'layout_json' added successfully.");
        
        // Also check if other necessary columns exist (just in case fix-db.js was behind)
        const columns = ['grid_x', 'grid_y', 'grid_w', 'grid_h', 'door_side', 'window_side', 'unit_type', 'features', 'size'];
        for (const col of columns) {
            try {
                await pool.query(`ALTER TABLE CondoUnits ADD COLUMN IF NOT EXISTS ${col} ${col.includes('grid') ? 'INT' : col === 'size' ? 'DECIMAL(10,2)' : 'VARCHAR(255)'};`);
                console.log(`Column '${col}' ensured.`);
            } catch (e) {
                console.log(`Column '${col}' check/add error:`, e.message);
            }
        }
    } catch (err) {
        console.error("Migration error:", err.message);
    } finally {
        pool.end();
        process.exit(0);
    }
}

migrate();
