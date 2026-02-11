
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const targetBranches = [
        { name: 'Salem', code: 'FC-SLM', address: 'Fairlands, Salem', city: 'Salem', state: 'Tamil Nadu' },
        { name: 'Erode', code: 'FC-ERD', address: 'Railway Station Road, Erode', city: 'Erode', state: 'Tamil Nadu' },
        { name: 'Coimbatore', code: 'FC-CBE', address: 'Gandhipuram, Coimbatore', city: 'Coimbatore', state: 'Tamil Nadu' },
        { name: 'Trichy', code: 'FC-TRY', address: 'Main Road, Trichy', city: 'Trichy', state: 'Tamil Nadu' },
    ];

    const targetCodes = targetBranches.map(b => b.code);

    console.log('Cleaning up branches...');

    // Find branches to delete
    const allBranches = await prisma.branch.findMany();
    const toDelete = allBranches.filter(b => !targetCodes.includes(b.code));

    for (const branch of toDelete) {
        try {
            console.log(`- Deleting branch: ${branch.name} (${branch.code})`);
            await prisma.branch.delete({ where: { id: branch.id } });
        } catch (e: any) {
            console.error(`  ! Could not delete ${branch.name}: ${e.message} (Likely due to associated data)`);
        }
    }

    console.log('Upserting target branches...');
    for (const branch of targetBranches) {
        const upserted = await prisma.branch.upsert({
            where: { code: branch.code },
            update: branch,
            create: branch,
        });
        console.log(`+ ${upserted.name} (${upserted.code})`);
    }

    console.log('Branch cleanup and seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
