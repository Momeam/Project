/**
 * 🧹 Cleanup Script: ลบผู้ขายที่ไม่มี seller_type ที่ถูกต้อง + ประกาศของพวกเขา
 * 
 * เงื่อนไข: ลบ Users ที่ role = 'SELLER' แต่ seller_type ไม่ใช่ DEVELOPER, OWNER, AGENT
 * จะลบทั้ง Properties และ User ออกจากระบบ
 * 
 * วิธีใช้: node cleanup-invalid-sellers.js
 */

const { pool } = require('./config/db');

async function cleanupInvalidSellers() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. หาผู้ขายที่ไม่มี seller_type ที่ถูกต้อง
        const invalidSellers = await client.query(`
            SELECT id, username, email, seller_type, role 
            FROM Users 
            WHERE role = 'SELLER' 
              AND (seller_type IS NULL OR seller_type NOT IN ('DEVELOPER', 'OWNER', 'AGENT'))
        `);

        console.log(`\n🔍 พบผู้ขายที่ไม่มีฐานะที่ถูกต้อง: ${invalidSellers.rows.length} คน\n`);

        if (invalidSellers.rows.length === 0) {
            console.log('✅ ไม่มีผู้ขายที่ต้องลบ — ระบบสะอาดดีแล้ว!');
            await client.query('ROLLBACK');
            return;
        }

        for (const seller of invalidSellers.rows) {
            console.log(`  ❌ ${seller.username} (ID: ${seller.id}) — seller_type: ${seller.seller_type || 'NULL'}`);

            // 2. ลบ Properties ของผู้ขายคนนี้
            const propsResult = await client.query('SELECT id FROM Properties WHERE userId = $1', [String(seller.id)]);
            if (propsResult.rows.length > 0) {
                const propIds = propsResult.rows.map(r => r.id);
                // ลบรูปภาพจาก disk
                const imagesResult = await client.query('SELECT image_url FROM PropertyImages WHERE property_id = ANY($1::int[])', [propIds]);
                for (const img of imagesResult.rows) {
                    const filepath = require('path').join(__dirname, img.image_url);
                    if (require('fs').existsSync(filepath)) {
                        require('fs').unlinkSync(filepath);
                        console.log(`     🗑️ ลบรูป: ${img.image_url}`);
                    }
                }
                await client.query('DELETE FROM Properties WHERE userId = $1', [String(seller.id)]);
                console.log(`     🏠 ลบประกาศ ${propsResult.rows.length} รายการ`);
            }

            // 3. ลบ User
            await client.query('DELETE FROM Users WHERE id = $1', [seller.id]);
            console.log(`     👤 ลบผู้ใช้ ${seller.username} สำเร็จ`);
        }

        await client.query('COMMIT');
        console.log(`\n✅ ลบผู้ขายที่ไม่ถูกต้องทั้งหมด ${invalidSellers.rows.length} คนเรียบร้อย!\n`);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ เกิดข้อผิดพลาด:', err.message);
    } finally {
        client.release();
        process.exit(0);
    }
}

cleanupInvalidSellers();
