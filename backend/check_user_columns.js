const { Client } = require('pg');
require('dotenv').config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function main() {
    try {
        await client.connect();
        const res = await client.query("SELECT * FROM users LIMIT 1");
        console.log('Columns in users record:', Object.keys(res.rows[0]));
        await client.end();
    } catch (err) {
        console.error('Query error:', err.message);
        await client.end();
        process.exit(1);
    }
}

main();
