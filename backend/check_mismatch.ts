import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const lead = await prisma.lead.findFirst({
        where: {
            firstName: "test1"
        },
        include: {
            branch: true
        }
    });

    if (lead) {
        console.log('--- LEAD "test1" ---');
        console.log(`ID: ${lead.id} | Branch: ${lead.branch.name} (${lead.branchId})`);
    } else {
        console.log('Lead "test1" not found');
    }

    const trainers = await prisma.user.findMany({
        where: { role: 'TRAINER' },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            branchId: true
        }
    });

    console.log('\n--- TRAINERS ---');
    trainers.forEach(t => {
        console.log(`Name: ${t.firstName} ${t.lastName} | Branch ID: ${t.branchId}`);
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
