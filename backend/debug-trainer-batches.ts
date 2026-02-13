
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTrainerBatches() {
    try {
        // 1. Get the first trainer (or a specific one if we knew the ID, but usually there's just one or a few in dev)
        const trainers = await prisma.trainer.findMany({
            include: {
                user: true,
                branch: true
            }
        });

        console.log(`Found ${trainers.length} trainers.`);

        for (const trainer of trainers) {
            console.log(`\n-----------------------------------`);
            console.log(`Trainer: ${trainer.user.firstName} ${trainer.user.lastName} (${trainer.id})`);
            console.log(`Branch: ${trainer.branch.name} (${trainer.branchId})`);

            // 2. Count batches for this branch
            const branchBatches = await prisma.batch.findMany({
                where: {
                    branchId: trainer.branchId,
                    isActive: true
                }
            });

            console.log(`Active Batches in Branch (${trainer.branchId}): ${branchBatches.length}`);
            branchBatches.forEach(b => {
                console.log(` - Batch: ${b.name} (${b.id}), isActive: ${b.isActive}`);
            });

            // Check legacy query (trainerId) just in case
            const trainerBatches = await prisma.batch.findMany({
                where: {
                    trainerId: trainer.id,
                    isActive: true
                }
            });
            console.log(`Batches directly assigned to Trainer: ${trainerBatches.length}`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkTrainerBatches();
