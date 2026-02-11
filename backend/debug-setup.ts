import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Attempting self-healing migration...');
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "photo" TEXT;`);
            console.log('Migration successful or column already exists.');
        } catch (migErr) {
            console.error('Migration failed:', migErr);
        }

        console.log('Fetching user count...');
        const userCount = await prisma.user.count();
        console.log('User count:', userCount);
    } catch (error) {
        console.error('DEBUG - Get setup status error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
