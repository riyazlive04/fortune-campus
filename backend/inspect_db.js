const { Client } = require('pg');
require('dotenv').config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function inspect() {
    try {
        await client.connect();
        console.log('Connected!');

        console.log('\n--- User Defined Types ---');
        const types = await client.query(`
        SELECT n.nspname as schema, t.typname as type 
        FROM pg_type t 
        LEFT JOIN pg_namespace n ON n.oid = t.typnamespace 
        WHERE (t.typrelid = 0 OR (SELECT c.relkind = 'c' FROM pg_class c WHERE c.oid = t.typrelid)) 
        AND NOT EXISTS(SELECT 1 FROM pg_type el WHERE el.oid = t.typelem AND el.typarray = t.oid)
        AND n.nspname NOT IN ('pg_catalog', 'information_schema');
    `);
        console.table(types.rows);

        console.log('\n--- Tables ---');
        const tables = await client.query(`
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    `);
        console.table(tables.rows);

        await client.end();
    } catch (err) {
        console.error('Inspection error:', err);
        process.exit(1);
    }
}

inspect();
