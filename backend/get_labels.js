const { Client } = require('pg');
require('dotenv').config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function getLabels() {
    try {
        await client.connect();
        const res = await client.query("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'UserRole'");
        console.log(JSON.stringify(res.rows));
        await client.end();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

getLabels();
