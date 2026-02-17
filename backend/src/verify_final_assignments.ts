
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Verifying Assignments...');

    const users = await prisma.user.findMany({
        where: {
            email: {
                in: [
                    'vasudevan.ceo@fortuneinnovatives.com',
                    'pranesh.cbe@fortuneinnovatives.com',
                    'vimal.erd@fortuneinnovatives.com',
                    'vishnu.tpr@fortuneinnovatives.com',
                    'sanjay.snj@fortuneinnovatives.com'
                ]
            }
        },
        include: { branch: true }
    });

    console.log('Found Users:', users.length);
    users.forEach(u => {
        console.log(`User: ${u.firstName} ${u.lastName} (${u.email})`);
        console.log(`  Role: ${u.role}`);
        console.log(`  Branch: ${u.branch ? `${u.branch.name} (${u.branch.code})` : 'None'}`);
        console.log('---');
    });

    const branches = await prisma.branch.findMany({
        where: {
            code: { in: ['CBE', 'ERD', 'TPR', 'SNJ', 'SLM'] }
        }
    });

    console.log('Found Branches:', branches.map(b => `${b.name} (${b.code})`).join(', '));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
