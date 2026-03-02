import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const ceo = await prisma.user.findFirst({ where: { role: 'CEO' } });
    const cp = await prisma.user.findFirst({ where: { role: 'CHANNEL_PARTNER' } });
    console.log('CEO Email:', ceo?.email);
    console.log('CP Email:', cp?.email);
}

main().finally(() => prisma.$disconnect());
