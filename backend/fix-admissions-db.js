const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addMissingColumns() {
    try {
        console.log("Checking and adding missing columns to Admissions table...");

        const columns = [
            { name: 'dateOfJoining', type: 'timestamp(3) without time zone' },
            { name: 'parentPhone', type: 'text' },
            { name: 'qualification', type: 'text' },
            { name: 'leadSource', type: 'text' },
            { name: 'aadhaarNumber', type: 'text' },
            { name: 'panNumber', type: 'text' },
            { name: 'selectedSoftware', type: 'text' },
            { name: 'paymentPlan', type: 'text' },
            { name: 'softwareFinishedAt', type: 'text' } // Using text for simplicity, or timestamp. Let's use timestamp(3) without time zone
        ];

        for (const col of columns) {
            try {
                const type = col.name === 'dateOfJoining' || col.name === 'softwareFinishedAt' ? 'timestamp(3) without time zone' : 'text';
                await prisma.$executeRawUnsafe(`ALTER TABLE "public"."admissions" ADD COLUMN IF NOT EXISTS "${col.name}" ${type};`);
                console.log(`Added column: ${col.name}`);
            } catch (err) {
                console.error(`Error adding ${col.name}:`, err.message);
            }
        }

        console.log("All missing columns added successfully!");
    } catch (err) {
        console.error("Fatal Error:", err);
    } finally {
        await prisma.$disconnect();
    }
}

addMissingColumns();
