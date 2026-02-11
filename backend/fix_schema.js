
const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function main() {
    try {
        console.log('Connecting to database...');
        await client.connect();

        console.log('Adding column softwareFinishedAt to admissions table...');

        // Check if column exists first to avoid error
        const checkRes = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='admissions' AND column_name='softwareFinishedAt';
        `);

        if (checkRes.rows.length > 0) {
            console.log('Column softwareFinishedAt already exists.');
        } else {
            await client.query('ALTER TABLE "admissions" ADD COLUMN "softwareFinishedAt" TIMESTAMP(3);');
            console.log('Column softwareFinishedAt added successfully!');
        }

        await client.end();
    } catch (err) {
        console.error('Error fixing schema:', err);
        process.exit(1);
    }
}

main();
