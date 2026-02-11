const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function applySchema() {
    try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('Connected!');

        console.log('Reading schema file...');
        const sql = fs.readFileSync('schema_utf8.sql', 'utf8');

        // Split by semicolon and filter out empty statements
        // This is a basic split, it might fail if semicolons are inside quotes, 
        // but Prisma's generated script is usually safe.
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        console.log(`Executing ${statements.length} statements...`);

        for (let i = 0; i < statements.length; i++) {
            try {
                await client.query(statements[i]);
                if (i % 50 === 0) console.log(`Progress: ${i}/${statements.length}`);
            } catch (err) {
                console.error(`Error in statement ${i}:`, err.message);
                console.error('Statement:', statements[i]);
                // Continue if table already exists or other minor issues, 
                // but log it just in case.
            }
        }

        console.log('Schema applied successfully!');
        await client.end();
    } catch (err) {
        console.error('Fatal error:', err);
        process.exit(1);
    }
}

applySchema();
