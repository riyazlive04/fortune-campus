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
        const res = await client.query(`
            SELECT u.email, u.role, b.name as branch_name 
            FROM users u 
            JOIN branches b ON u."branchId" = b.id 
            WHERE u.email IN (
                'cbe.fortuneinnovatives@gmail.com',
                'trichy.fortuneinnovatives@gmail.com',
                'salem.fortuneinnovatives@gmail.com',
                'erode.fortuneinnovatives@gmail.com'
            )
        `);
        console.log('Created Accounts:');
        console.log(JSON.stringify(res.rows, null, 2));
        await client.end();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
