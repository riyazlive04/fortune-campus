const { Client } = require('pg');
const bcrypt = require('bcryptjs');
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
        const email = 'trichy.fortuneinnovatives@gmail.com';
        const res = await client.query('SELECT * FROM users WHERE email = $1', [email]);

        if (res.rows.length === 0) {
            console.log(`User ${email} NOT FOUND in DB.`);
        } else {
            const user = res.rows[0];
            console.log('User found:');
            console.log('ID:', user.id);
            console.log('Email:', user.email);
            console.log('Role:', user.role);
            console.log('IsActive:', user.isActive);
            console.log('Hashed Password in DB:', user.password);

            const passwordMatch = await bcrypt.compare('Branch@123', user.password);
            console.log('Password "Branch@123" matches hash?', passwordMatch);
        }
        await client.end();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
