
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- DB Check ---');
    // Mask password in URL
    const url = process.env.DATABASE_URL || 'UNDEFINED';
    console.log('URL:', url.replace(/:[^:]*@/, ':****@'));

    const userCount = await prisma.user.count();
    console.log('User Count:', userCount);

    const branchCount = await prisma.branch.count();
    console.log('Branch Count:', branchCount);

    const users = await prisma.user.findMany({
        select: { email: true, role: true, firstName: true }
    });
    console.log('--- Emails ---');
    users.forEach(u => console.log(`${u.email} (${u.role}) - ${u.firstName}`));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
