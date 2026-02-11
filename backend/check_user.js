const { Client } = require('pg');
require('dotenv').config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function checkUser() {
    try {
        await client.connect();
        const res = await client.query('SELECT id, email, "isActive" FROM users WHERE email = \'ceo@fortunecampus.com\'');
        console.log(JSON.stringify(res.rows));
        await client.end();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUser();
