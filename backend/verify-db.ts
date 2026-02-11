import { PrismaClient } from '@prisma/client';
import { UserRole } from './src/types/enums';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Checking database...');

        const branch = await prisma.branch.findFirst();
        console.log('Default Branch:', branch ? `Found: ${branch.name} (${branch.id})` : 'NOT FOUND');

        const ceo = await prisma.user.findFirst({ where: { role: UserRole.CEO } });
        console.log('CEO User:', ceo ? `Found: ${ceo.firstName} ${ceo.lastName} (${ceo.id})` : 'NOT FOUND');

        if (!branch && !ceo) {
            console.log('CRITICAL ERROR: Both Branch and CEO are missing.');
        } else if (!branch) {
            console.log('CRITICAL ERROR: Default Branch is missing.');
        } else if (!ceo) {
            console.log('CRITICAL ERROR: CEO User is missing.');
        } else {
            console.log('Database verification successful. Prerequisites met.');
        }

    } catch (error) {
        console.error('Error verifying database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
