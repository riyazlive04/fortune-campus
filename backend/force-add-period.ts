
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Attempting to add "period" column to "attendances" table...');
        const result = await prisma.$executeRawUnsafe(`
            ALTER TABLE "attendances" 
            ADD COLUMN IF NOT EXISTS "period" INTEGER DEFAULT 1;
        `);
        console.log('Result:', result);
        console.log('Column "period" added (or already existed).');
    } catch (e) {
        console.error('Error adding column:');
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
