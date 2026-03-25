const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_4GSN5vqtrhzp@ep-nameless-dream-a1b3fs72-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
});

async function getAdminPassword() {
    try {
        const queryText = "SELECT username, email, password FROM Users WHERE role = 'ADMIN'";
        const res = await pool.query(queryText);
        console.log('Admin Accounts:', JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error('Query Error:', err);
    } finally {
        await pool.end();
    }
}

getAdminPassword();
