import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkScoringData() {
    try {
        console.log('Checking Student Growth Reports...');
        const reports = await prisma.studentGrowthReport.count();
        console.log(`Total Growth Reports: ${reports}`);

        if (reports === 0) {
            console.log('No growth reports exist. This is why scores are 0.');
        } else {
            const sample = await prisma.studentGrowthReport.findFirst({
                orderBy: { reportDate: 'desc' }
            });
            console.log('Sample report date:', sample.reportDate);
        }

        const trainers = await prisma.trainer.count();
        console.log(`Total Trainers: ${trainers}`);

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkScoringData().catch(console.error);
