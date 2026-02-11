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

        console.log('Fetching all branches...');
        const allBranchesRes = await client.query('SELECT id, name FROM branches');
        const allBranches = allBranchesRes.rows;
        console.log('All Branches in DB:', allBranches);

        const hashedPassword = await bcrypt.hash(PASSWORD, 10);

        for (const account of branchAccounts) {
            console.log(`\nChecking: ${account.branchName} (${account.email})`);

            // Try matching
            const branch = allBranches.find(b =>
                b.name.toLowerCase().includes(account.branchName.toLowerCase()) ||
                account.branchName.toLowerCase().includes(b.name.toLowerCase())
            );

            if (!branch) {
                console.warn(`❌ No match found for ${account.branchName}`);
                continue;
            }

            console.log(`✅ Matched with branch: ${branch.name} (ID: ${branch.id})`);

            const userId = crypto.randomUUID();
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
            `, [userId, account.email.trim(), hashedPassword, branch.name, 'Branch Head', 'BRANCH_HEAD', branch.id, true]);

            console.log(`Successfully created/updated account for ${account.email}`);
        }

        await client.end();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
