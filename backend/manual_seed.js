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
        await client.query(`
      INSERT INTO "users" ("id", "email", "password", "firstName", "lastName", "phone", "role", "isActive", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT ("email") DO NOTHING
    `, [ceoId, 'ceo@fortunecampus.com', adminPassword, 'Rajesh', 'Kumar', '+91-9876543200', 'CEO', true]);

        console.log('Database seeded successfully with core data!');
        console.log('CEO Login: ceo@fortunecampus.com / Admin@123');

        await client.end();
    } catch (err) {
        console.error('Seed error:', err);
        process.exit(1);
    }
}

seed();
