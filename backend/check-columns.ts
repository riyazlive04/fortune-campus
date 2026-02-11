import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Checking if "photo" column exists in "User" table...');
        const result: any[] = await prisma.$queryRawUnsafe(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'User';
    `);

        console.log('Columns in "User" table:');
        result.forEach(row => console.log(` - ${row.column_name}`));

        const hasPhoto = result.some(row => row.column_name === 'photo');
        console.log(`\nHas "photo" column: ${hasPhoto}`);
    } catch (error) {
        console.error('Failed to query database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
