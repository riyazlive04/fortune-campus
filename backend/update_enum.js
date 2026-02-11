const { Client } = require('pg');
require('dotenv').config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function updateEnum() {
    try {
        await client.connect();
        console.log('Connected!');

        // Add CEO role
        await client.query("ALTER TYPE \"UserRole\" ADD VALUE IF NOT EXISTS 'CEO'");
        console.log('CEO role added to UserRole enum.');

        await client.end();
    } catch (err) {
        if (err.message.includes('already exists')) {
            console.log('CEO role already exists.');
        } else {
            console.error(err.message);
            process.exit(1);
        }
    }
}

updateEnum();
