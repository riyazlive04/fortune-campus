const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function testConnection() {
    try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('Connection successful!');

        const res = await client.query('SELECT NOW()');
        console.log('Query result:', res.rows[0]);

        await client.end();
        console.log('Connection closed.');
    } catch (err) {
        console.error('Connection error:', err);
        process.exit(1);
    }
}

testConnection();
