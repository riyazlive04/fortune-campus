const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addMissingStudentColumns() {
    try {
        console.log("Checking and adding missing columns to Students table...");

        const columns = [
            { name: 'dateOfJoining', type: 'timestamp(3) without time zone' },
            { name: 'parentPhone', type: 'text' },
            { name: 'qualification', type: 'text' },
            { name: 'leadSource', type: 'text' },
            { name: 'aadhaarNumber', type: 'text' },
            { name: 'panNumber', type: 'text' },
            { name: 'selectedSoftware', type: 'text' },
            { name: 'paymentPlan', type: 'text' },
            { name: 'softwareFinishedAt', type: 'timestamp(3) without time zone' }
        ];

        for (const col of columns) {
            try {
                await prisma.$executeRawUnsafe(`ALTER TABLE "public"."students" ADD COLUMN IF NOT EXISTS "${col.name}" ${col.type};`);
                console.log(`Added column: ${col.name}`);
            } catch (err) {
                console.error(`Error adding ${col.name}:`, err.message);
            }
        }

        console.log("All missing columns added to Students successfully!");
    } catch (err) {
        console.error("Fatal Error:", err);
    } finally {
        await prisma.$disconnect();
    }
}

addMissingStudentColumns();
