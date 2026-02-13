
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const trainers = await prisma.trainer.findMany({
            include: { branch: true }
        });
        console.log('Trainers:', trainers.length);
        if (trainers.length > 0) {
            const first = trainers[0];
            console.log('Trainer Branch:', first.branchId);
            const batches = await prisma.batch.findMany({
                where: { branchId: first.branchId }
            });
            console.log('Batches:', batches);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
