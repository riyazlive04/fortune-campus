
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const branches = await prisma.branch.findMany({
        include: {
            _count: {
                select: { leads: true }
            }
        }
    });

    console.log('--- Lead Counts by Branch ---');
    branches.forEach(b => {
        console.log(`${b.name} (${b.code}): ${b._count.leads} leads`);
    });

    const ceo = await prisma.user.findFirst({ where: { role: 'CEO' } });
    console.log('--- CEO User ---');
    console.log(`Name: ${ceo?.firstName} ${ceo?.lastName}`);
    console.log(`Role: ${ceo?.role}`);
    console.log(`BranchId: ${ceo?.branchId}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
