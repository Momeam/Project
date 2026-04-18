const { pool } = require('./config/db');

async function run() {
    // Check PropertyImages table  
    const imgs = await pool.query('SELECT * FROM PropertyImages LIMIT 10');
    console.log('PropertyImages sample:', JSON.stringify(imgs.rows));
    
    // Check column names in PropertyImages
    const cols = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'propertyimages'
    `);
    console.log('PropertyImages columns:', JSON.stringify(cols.rows));

    // Check if images table uses property_id or propertyId
    const join = await pool.query(`
        SELECT p.id, p.title, pi.id as img_id, pi.image_url
        FROM Properties p
        LEFT JOIN PropertyImages pi ON pi.property_id = p.id
        WHERE p.userid = '27'
        LIMIT 5
    `);
    console.log('Join result:', JSON.stringify(join.rows));

    process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
