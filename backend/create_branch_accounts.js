const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
require('dotenv').config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const branchAccounts = [
    { email: 'cbe.fortuneinnovatives@gmail.com', branchName: 'Coimbatore' },
    { email: 'trichy.fortuneinnovatives@gmail.com', branchName: 'Trichy' },
    { email: 'salem.fortuneinnovatives@gmail.com', branchName: 'Salem' },
    { email: 'erode.fortuneinnovatives@gmail.com', branchName: 'Erode' }
];

const PASSWORD = 'Branch@123';

async function main() {
    try {
        await client.connect();
        console.log('Connected to database.');

        const hashedPassword = await bcrypt.hash(PASSWORD, 10);
        console.log('Password hashed.');

        for (const account of branchAccounts) {
            console.log(`Processing ${account.email} for branch ${account.branchName}...`);

            // Find branch
            const branchRes = await client.query('SELECT id FROM branches WHERE name ILIKE $1', [account.branchName]);

            if (branchRes.rows.length === 0) {
                console.warn(`Branch ${account.branchName} not found! Skipping.`);
                continue;
            }

            const branchId = branchRes.rows[0].id;
            const userId = crypto.randomUUID();

            console.log(`Found branch ID: ${branchId}. Creating user...`);

            await client.query(`
                INSERT INTO "users" ("id", "email", "password", "firstName", "lastName", "role", "branchId", "isActive", "updatedAt")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
                ON CONFLICT ("email") 
                DO UPDATE SET 
                    "password" = EXCLUDED."password",
                    "role" = EXCLUDED."role",
                    "branchId" = EXCLUDED."branchId",
                    "isActive" = EXCLUDED."isActive",
                    "updatedAt" = NOW()
            `, [userId, account.email, hashedPassword, account.branchName, 'Branch Head', 'BRANCH_HEAD', branchId, true]);

            console.log(`Account ${account.email} created/updated successfully.`);
        }

        await client.end();
        console.log('All done.');
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

main();
