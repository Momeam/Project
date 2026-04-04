const { pool } = require('./config/db');

async function test() {
    const res = await pool.query('SELECT id, "userId", title, is_project FROM Properties');
    console.log(res.rows);
    process.exit(0);
}
test();
