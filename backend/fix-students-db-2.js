const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addMissingStudentColumns() {
    try {
        console.log("Checking and adding missing columns to Students table...");

        const columns = [
            { name: 'dateOfBirth', type: 'timestamp(3) without time zone' },
            { name: 'gender', type: 'text' },
            { name: 'address', type: 'text' }
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
