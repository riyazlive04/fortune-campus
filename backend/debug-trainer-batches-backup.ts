
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const trainer = await prisma.trainer.findFirst({
            include: { branch: true }
        });
        console.log('First Trainer:', trainer);
        if (trainer) {
            const batches = await prisma.batch.findMany({
                where: { branchId: trainer.branchId }
            });
            console.log('Batches for branch', trainer.branchId, ':', batches);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
