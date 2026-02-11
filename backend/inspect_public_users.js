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
        const res = await client.query(`
            SELECT column_name, data_type, udt_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'users'
            ORDER BY ordinal_position
        `);
        console.log('Columns in "public.users" table:');
        console.log(JSON.stringify(res.rows, null, 2));
        await client.end();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
