const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function fix() {
    console.log('Adding totalPlacements column via raw SQL...');
    try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "totalPlacements" INTEGER DEFAULT 0;`);
        console.log('Column added successfully.');
    } catch (err) {
        console.error('Error adding column:', err.message);
    }
}
fix().finally(() => prisma.$disconnect());
