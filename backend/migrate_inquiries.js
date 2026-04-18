const { pool } = require('./config/db');

async function migrate() {
    // ดึง inquiries ที่ยังไม่มีคู่ใน messages table
    const inquiries = await pool.query(`
        SELECT i.* FROM Inquiries i
        WHERE i.sender_id IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 FROM Messages m
            WHERE m.sender_id = i.sender_id
            AND m.receiver_id = i.receiver_id
            AND m.property_id = i.property_id
            AND m.message = i.message
        )
    `);

    console.log(`Found ${inquiries.rows.length} inquiries to migrate...`);

    for (const inq of inquiries.rows) {
        await pool.query(
            'INSERT INTO Messages (sender_id, receiver_id, property_id, message, created_at) VALUES ($1, $2, $3, $4, $5)',
            [inq.sender_id, inq.receiver_id, inq.property_id, inq.message, inq.createdat || new Date()]
        );
        console.log(`  ✅ Migrated inquiry #${inq.id}`);
    }

    console.log('Migration complete!');
    process.exit(0);
}

migrate().catch(e => { console.error(e.message); process.exit(1); });
