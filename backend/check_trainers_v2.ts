import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const trainers = await prisma.user.findMany({
        where: {
            role: 'TRAINER',
        },
        include: {
            branch: true,
            trainerProfile: true
        }
    });

    console.log('--- TRAINERS ---');
    trainers.forEach(t => {
        console.log(`ID: ${t.id} | Name: ${t.firstName} ${t.lastName} | Branch: ${t.branch?.name || 'NONE'} (${t.branchId}) | Active: ${t.isActive}`);
    });

    const branches = await prisma.branch.findMany();
    console.log('\n--- BRANCHES ---');
    branches.forEach(b => {
        console.log(`ID: ${b.id} | Name: ${b.name}`);
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
