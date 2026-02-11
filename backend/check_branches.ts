import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const branches = await prisma.branch.findMany({
        select: {
            id: true,
            name: true,
        },
    });
    console.log('Existing Branches:');
    console.log(JSON.stringify(branches, null, 2));

    const users = await prisma.user.findMany({
        where: {
            role: 'BRANCH_HEAD'
        },
        select: {
            email: true,
            branchId: true
        }
    });
    console.log('Existing Branch Heads:');
    console.log(JSON.stringify(users, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
