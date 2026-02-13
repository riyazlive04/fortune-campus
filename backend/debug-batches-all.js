
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        // 1. Check all batches
        const allBatches = await prisma.batch.findMany({
            include: { branch: true, trainer: { include: { user: true } } }
        });
        console.log('--- ALL BATCHES ---');
        allBatches.forEach(b => {
            console.log(`ID: ${b.id}, Name: ${b.name}, Branch: ${b.branch?.name} (${b.branchId}), Active: ${b.isActive}, Trainer: ${b.trainer?.user?.firstName}`);
        });

        // 2. Check Trainer 1
        const trainer1 = await prisma.user.findFirst({
            where: { firstName: 'Trainer', lastName: '1' },
            include: { trainer: { include: { branch: true } } }
        });

        if (trainer1 && trainer1.trainer) {
            console.log('\n--- Trainer 1 ---');
            console.log(`Trainer ID: ${trainer1.trainer.id}`);
            console.log(`Branch: ${trainer1.trainer.branch.name} (${trainer1.trainer.branchId})`);

            // Check batches for this specific branch
            const batchesForBranch = await prisma.batch.findMany({
                where: { branchId: trainer1.trainer.branchId }
            });
            console.log(`Batches in Trainer 1 Branch: ${batchesForBranch.length}`);
        } else {
            console.log('\nTrainer 1 not found or has no trainer profile.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
