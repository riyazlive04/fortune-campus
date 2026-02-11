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

        console.log('--- BRANCHES ---');
        const branches = await client.query('SELECT id, name FROM branches');
        console.log(JSON.stringify(branches.rows, null, 2));

        console.log('--- ALL USERS ---');
        const users = await client.query('SELECT id, email, role, "branchId" FROM users');
        console.log(JSON.stringify(users.rows, null, 2));

        await client.end();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
