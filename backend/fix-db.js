const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function fix() {
    console.log('Adding columns via raw SQL...');
    try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "totalLeads" INTEGER DEFAULT 0;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "totalAdmissions" INTEGER DEFAULT 0;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "totalStudents" INTEGER DEFAULT 0;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "totalRevenue" DOUBLE PRECISION DEFAULT 0;`);
        console.log('Columns added successfully.');
    } catch (err) {
        console.error('Error adding columns:', err.message);
    }
}
fix().finally(() => prisma.$disconnect());
