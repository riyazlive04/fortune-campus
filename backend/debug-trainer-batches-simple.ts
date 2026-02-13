
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Fetching trainers...');
        const trainers = await prisma.trainer.findMany({
            include: {
                branch: {
                    include: {
                        batches: true
                    }
                },
                user: true
            }
        });

        console.log(JSON.stringify(trainers, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
