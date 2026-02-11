const { Client } = require('pg');
require('dotenv').config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function fixColumn() {
    try {
        await client.connect();
        console.log('Connected!');

        console.log('Converting users.role to TEXT...');
        await client.query('ALTER TABLE "users" ALTER COLUMN "role" TYPE TEXT');

        // Also convert other columns that might be enums
        const tables = ['leads', 'admissions', 'attendances', 'placements', 'incentives'];
        const columns = ['status', 'source', 'type']; // common names

        // For simplicity, let's just do the ones we know are problematic
        await client.query('ALTER TABLE "leads" ALTER COLUMN "status" TYPE TEXT');
        await client.query('ALTER TABLE "leads" ALTER COLUMN "source" TYPE TEXT');
        await client.query('ALTER TABLE "admissions" ALTER COLUMN "status" TYPE TEXT');
        await client.query('ALTER TABLE "attendances" ALTER COLUMN "status" TYPE TEXT');
        await client.query('ALTER TABLE "placements" ALTER COLUMN "status" TYPE TEXT');
        await client.query('ALTER TABLE "incentives" ALTER COLUMN "type" TYPE TEXT');

        console.log('Columns converted to TEXT successfully!');
        await client.end();
    } catch (err) {
        console.error('Fix error:', err.message);
        await client.end();
        process.exit(1);
    }
}

fixColumn();
