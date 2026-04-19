const { pool } = require('./config/db');

async function cleanup() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. ล้าง seller_type ของ USER ที่ไม่ใช่ SELLER (ไม่ได้สมัครจริง แค่ default)
        const clearNonSellers = await client.query(
            `UPDATE Users SET seller_type = NULL 
             WHERE role NOT IN ('SELLER') AND seller_type IS NOT NULL
             RETURNING id, username, role, seller_type`
        );
        console.log(`\n✅ ล้าง seller_type ของ ${clearNonSellers.rowCount} users ที่ไม่ใช่ SELLER:`);
        console.table(clearNonSellers.rows);

        // 2. แสดงผลหลังล้าง
        const result = await client.query(
            `SELECT id, username, full_name, role, seller_type FROM Users ORDER BY id`
        );
        console.log('\n=== Users หลังล้างข้อมูล ===');
        console.table(result.rows);

        await client.query('COMMIT');
        console.log('\n✅ Cleanup สำเร็จ!');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error:', err.message);
    } finally {
        client.release();
        process.exit(0);
    }
}

setTimeout(cleanup, 2000);
