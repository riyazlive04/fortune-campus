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
        const emails = [
            'cbe.fortuneinnovatives@gmail.com',
            'trichy.fortuneinnovatives@gmail.com',
            'salem.fortuneinnovatives@gmail.com',
            'erode.fortuneinnovatives@gmail.com'
        ];

        for (const email of emails) {
            const res = await client.query('SELECT u.email, u.password, u.isActive, b.name as branch_name FROM users u JOIN branches b ON u."branchId" = b.id WHERE u.email = $1', [email]);
            if (res.rows.length === 0) {
                console.log(`❌ User ${email} NOT FOUND in DB.`);
            } else {
                const user = res.rows[0];
                const match = await bcrypt.compare('Branch@123', user.password);
                console.log(`✅ User: ${user.email} | Branch: ${user.branch_name} | Active: ${user.isActive} | PW Match: ${match}`);
            }
        }
        await client.end();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
