
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Checking for softwareFinishedAt column...');
        const result: any[] = await prisma.$queryRawUnsafe(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='admissions' AND column_name='softwareFinishedAt';
    `);

        if (result.length > 0) {
            console.log('Column softwareFinishedAt already exists.');
        } else {
            console.log('Adding column softwareFinishedAt...');
            await prisma.$executeRawUnsafe(`ALTER TABLE "admissions" ADD COLUMN "softwareFinishedAt" TIMESTAMP(3);`);
            console.log('Column added successfully.');
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
