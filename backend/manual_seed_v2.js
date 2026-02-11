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

async function seed() {
    try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('Connected!');

        console.log('Fetching existing enums...');
        // This will help us see if we need to cast or use specific values
        const enumQuery = await client.query("SELECT n.nspname as schema, t.typname as type, e.enumlabel as label FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public'");
        console.log('Defined enums:', enumQuery.rows);

        const adminPassword = await bcrypt.hash('Admin@123', 10);
        const branchId = crypto.randomUUID();
        const ceoId = crypto.randomUUID();

        console.log('Creating Main Branch...');
        await client.query(`
      INSERT INTO "branches" ("id", "name", "code", "address", "city", "state", "phone", "email", "isActive", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      ON CONFLICT ("code") DO NOTHING
    `, [branchId, 'Fortune Campus - Main', 'FC-MAIN', '123 Education Lane', 'Bangalore', 'Karnataka', '+91-80-123456', 'contact@fortunecampus.com', true]);

        console.log('Creating CEO User...');
        // We try to insert. If role is an enum, Postgres will usually cast a matching string automatically.
        // If it fails, we will see the error.
        await client.query(`
      INSERT INTO "users" ("id", "email", "password", "firstName", "lastName", "phone", "role", "isActive", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, CAST($7 AS "UserRole"), $8, NOW())
      ON CONFLICT ("email") DO NOTHING
    `, [ceoId, 'ceo@fortunecampus.com', adminPassword, 'Rajesh', 'Kumar', '+91-9876543200', 'CEO', true]);

        console.log('Database seeded successfully with core data!');
        console.log('CEO Login: ceo@fortunecampus.com / Admin@123');

        await client.end();
    } catch (err) {
        console.error('Seed error:', err.message);
        if (err.detail) console.error('Detail:', err.detail);
        await client.end();
        process.exit(1);
    }
}

seed();
