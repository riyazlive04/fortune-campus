
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Attempting to update unique constraint on "attendances"...');

        // 1. Drop the old unique index
        try {
            await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "attendances_studentId_courseId_date_key";`);
            console.log('Dropped old index: attendances_studentId_courseId_date_key');
        } catch (e) {
            console.log('Old index drop failed (might not exist):', e.message);
        }

        // 2. Create the new unique index
        try {
            await prisma.$executeRawUnsafe(`
                CREATE UNIQUE INDEX "attendances_studentId_courseId_date_period_key" 
                ON "attendances"("studentId", "courseId", "date", "period");
            `);
            console.log('Created new index: attendances_studentId_courseId_date_period_key');
        } catch (e) {
            console.log('New index creation failed (might already exist):', e.message);
        }

    } catch (e) {
        console.error('Script failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
