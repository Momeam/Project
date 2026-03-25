const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_4GSN5vqtrhzp@ep-nameless-dream-a1b3fs72-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
});

async function upgradeToAdmin() {
    try {
        const username = 'foolk';
        const id = 8;
        const queryText = "UPDATE Users SET role = 'ADMIN' WHERE username = $1 OR id = $2 RETURNING id, username, email, role";
        const res = await pool.query(queryText, [username, id]);
        console.log('Update Result:', res.rows);
    } catch (err) {
        console.error('Update Error:', err);
    } finally {
        await pool.end();
    }
}

upgradeToAdmin();
